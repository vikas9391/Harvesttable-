# contact/views.py
from typing import Any, cast
import logging
import traceback
import threading

from django.db import models as db_models
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response

from .models import ContactMessage
from .serializers import (
    ContactFormSerializer,
    ContactMessageSerializer,
    ContactMessageListSerializer,
    UpdateStatusSerializer,
)
from .emails import send_auto_reply, send_staff_notification

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_ip(request: Request) -> str | None:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')


def _parse_lang(raw: Any) -> str:
    if not raw:
        return 'en'
    code = str(raw).lower().split('-')[0].strip()
    return code if code in ('en', 'fr', 'ar') else 'en'


def _send_emails(msg_pk: int, email: str, name: str, subject: str, message: str, lang: str) -> None:
    """
    Send both emails in a background thread.
    We pass primitive values (not the ORM object) to avoid Django's
    database connection issues across threads.
    """
    # Re-fetch the message inside the thread to get a fresh DB connection
    try:
        msg = ContactMessage.objects.get(pk=msg_pk)
    except ContactMessage.DoesNotExist:
        logger.error('[contact] Message #%s not found in email thread', msg_pk)
        return

    # ── Auto-reply ────────────────────────────────────────────────────────
    logger.info('[contact] Sending auto-reply to %s for message #%s', email, msg_pk)
    try:
        send_auto_reply(msg)
        logger.info('[contact] Auto-reply sent to %s', email)
    except Exception as exc:
        logger.error(
            '[contact] Auto-reply FAILED for #%s: %s\n%s',
            msg_pk, exc, traceback.format_exc(),
        )

    # ── Staff notification ────────────────────────────────────────────────
    logger.info('[contact] Sending staff notification for #%s', msg_pk)
    try:
        send_staff_notification(msg)
        logger.info('[contact] Staff notification sent for #%s', msg_pk)
    except Exception as exc:
        logger.error(
            '[contact] Staff notification FAILED for #%s: %s\n%s',
            msg_pk, exc, traceback.format_exc(),
        )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/contact/submit/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def submit(request: Request) -> Response:
    ser = ContactFormSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    data: dict[str, Any] = cast(dict[str, Any], ser.validated_data)
    lang = _parse_lang(data.get('lang'))

    msg = ContactMessage.objects.create(
        name       = str(data['name']).strip(),
        email      = str(data['email']).strip().lower(),
        subject    = str(data['subject']).strip(),
        message    = str(data['message']).strip(),
        lang       = lang,
        user       = request.user if request.user.is_authenticated else None,
        ip_address = _get_ip(request),
        user_agent = request.META.get('HTTP_USER_AGENT', ''),
    )

    logger.info('[contact] Message #%s created from %s', msg.pk, msg.email)

    # ── Fire email thread and return 201 immediately ──────────────────────
    # Pass msg.pk (int) not the ORM object — avoids cross-thread DB issues
    thread = threading.Thread(
        target  = _send_emails,
        args    = (msg.pk, msg.email, msg.name, msg.subject, msg.message, msg.lang),
        daemon  = True,   # daemon=True so it doesn't block gunicorn shutdown
    )
    thread.start()
    logger.info('[contact] Email thread started for #%s', msg.pk)

    # Return immediately — do NOT join/wait for the thread
    return Response(
        {
            'success':    True,
            'message_id': msg.pk,
            'detail':     "Your message has been received. We'll be in touch within 24 hours.",
        },
        status=status.HTTP_201_CREATED,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/contact/admin/messages/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list(request: Request) -> Response:
    qs = ContactMessage.objects.select_related('user').all()

    status_param = request.query_params.get('status', '').strip()
    if status_param in ('new', 'in_progress', 'resolved', 'spam'):
        qs = qs.filter(status=status_param)

    lang_param = request.query_params.get('lang', '').strip().lower()
    if lang_param in ('en', 'fr', 'ar'):
        qs = qs.filter(lang=lang_param)

    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(
            db_models.Q(name__icontains=search)
            | db_models.Q(email__icontains=search)
            | db_models.Q(subject__icontains=search)
            | db_models.Q(message__icontains=search)
        )

    try:
        page      = max(int(request.query_params.get('page', 1)), 1)
        page_size = min(int(request.query_params.get('page_size', 25)), 100)
    except (ValueError, TypeError):
        page, page_size = 1, 25

    start = (page - 1) * page_size
    total = qs.count()

    return Response({
        'count':   total,
        'page':    page,
        'results': ContactMessageListSerializer(qs[start:start + page_size], many=True).data,
    })


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/contact/admin/messages/<pk>/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_detail(request: Request, pk: int) -> Response:
    msg = ContactMessage.objects.filter(pk=pk).first()
    if not msg:
        return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(ContactMessageSerializer(msg).data)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/contact/admin/messages/<pk>/status/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_update_status(request: Request, pk: int) -> Response:
    msg = ContactMessage.objects.filter(pk=pk).first()
    if not msg:
        return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

    ser = UpdateStatusSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    data: dict[str, Any] = cast(dict[str, Any], ser.validated_data)
    update_fields = ['status', 'updated_at']

    msg.status = data['status']
    if data.get('admin_note'):
        msg.admin_note = data['admin_note']
        update_fields.append('admin_note')

    msg.save(update_fields=update_fields)

    return Response({
        'id':         msg.pk,
        'status':     msg.status,
        'admin_note': msg.admin_note,
    })


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/contact/admin/messages/<pk>/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete(request: Request, pk: int) -> Response:
    msg = ContactMessage.objects.filter(pk=pk).first()
    if not msg:
        return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
    msg.delete()
    return Response({'deleted': True, 'id': pk}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/contact/admin/stats/
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request: Request) -> Response:
    now      = timezone.now()
    week_ago = now - timedelta(days=7)

    return Response({
        'total':       ContactMessage.objects.count(),
        'new':         ContactMessage.objects.filter(status='new').count(),
        'in_progress': ContactMessage.objects.filter(status='in_progress').count(),
        'resolved':    ContactMessage.objects.filter(status='resolved').count(),
        'spam':        ContactMessage.objects.filter(status='spam').count(),
        'today':       ContactMessage.objects.filter(created_at__date=now.date()).count(),
        'this_week':   ContactMessage.objects.filter(created_at__gte=week_ago).count(),
        'by_lang': {
            lang: ContactMessage.objects.filter(lang=lang).count()
            for lang in ('en', 'fr', 'ar')
        },
    })
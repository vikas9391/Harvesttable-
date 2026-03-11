# contact/views.py
from typing import Any

from django.db import models as db_models
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from typing import cast


from .models import ContactMessage
from .serializers import (
    ContactFormSerializer,
    ContactMessageSerializer,
    ContactMessageListSerializer,
    UpdateStatusSerializer,
)
from .emails import send_auto_reply, send_staff_notification


def _get_ip(request: Request) -> str | None:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')


def _parse_lang(raw: Any) -> str:
    if not raw:
        return 'en'
    code = str(raw).lower().split('-')[0].strip()
    return code if code in ('en', 'fr', 'ar') else 'en'


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/contact/submit/
# Public — anyone can submit the form (logged-in or anonymous)
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def submit(request: Request) -> Response:
    ser = ContactFormSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    data: dict[str, Any] = cast(dict[str, Any], ser.validated_data)
    lang = _parse_lang(data.get('lang'))

    # ── Create the record ──────────────────────────────────────────────────
    msg = ContactMessage.objects.create(
        name       = data['name'].strip(),
        email      = data['email'].strip().lower(),
        subject    = data['subject'].strip(),
        message    = data['message'].strip(),
        lang       = lang,
        user       = request.user if request.user.is_authenticated else None,
        ip_address = _get_ip(request),
        user_agent = request.META.get('HTTP_USER_AGENT', ''),
    )

    # ── Send emails (non-blocking — failures are logged, not raised) ───────
    send_auto_reply(msg)
    send_staff_notification(msg)

    return Response(
        {
            'success':    True,
            'message_id': msg.pk,
            'detail':     'Your message has been received. We\'ll be in touch within 24 hours.',
        },
        status=status.HTTP_201_CREATED,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/contact/admin/messages/
# Admin — paginated list with search + status filter
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list(request: Request) -> Response:
    qs = ContactMessage.objects.select_related('user').all()

    # Filter by status
    status_param = request.query_params.get('status', '').strip()
    if status_param in ('new', 'in_progress', 'resolved', 'spam'):
        qs = qs.filter(status=status_param)

    # Filter by language
    lang_param = request.query_params.get('lang', '').strip().lower()
    if lang_param in ('en', 'fr', 'ar'):
        qs = qs.filter(lang=lang_param)

    # Search across name / email / subject / message
    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(
            db_models.Q(name__icontains=search)
            | db_models.Q(email__icontains=search)
            | db_models.Q(subject__icontains=search)
            | db_models.Q(message__icontains=search)
        )

    # Pagination
    page      = max(int(request.query_params.get('page', 1)), 1)
    page_size = min(int(request.query_params.get('page_size', 25)), 100)
    start     = (page - 1) * page_size
    total     = qs.count()

    return Response({
        'count':   total,
        'page':    page,
        'results': ContactMessageListSerializer(qs[start:start + page_size], many=True).data,
    })


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/contact/admin/messages/<pk>/
# Admin — full detail view
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
# Admin — update status and optional internal note
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
# Admin — hard delete a message
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
# Admin — summary counts for dashboard
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request: Request) -> Response:
    from datetime import timedelta
    from django.utils import timezone

    now      = timezone.now()
    week_ago = now - timedelta(days=7)

    total = ContactMessage.objects.count()

    return Response({
        'total':       total,
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
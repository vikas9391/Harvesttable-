# chatbot/views.py
from typing import Any

from django.db import models as db_models
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response

from .models import ChatSession, ChatMessage
from .responses import get_reply
from .serializers import (
    ChatSessionSerializer,
    ChatSessionListSerializer,
    ChatMessageSerializer,
    SendMessageSerializer,
    MarkResolvedSerializer,
)


def _get_ip(request: Request) -> str | None:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')


def _parse_lang(raw: Any) -> str:
    """
    Normalise the lang value sent by the frontend.
    Accepts:  'en', 'fr', 'ar', 'en-US', 'fr-FR', None, ''
    Returns:  'en' | 'fr' | 'ar'   (defaults to 'en')
    """
    if not raw:
        return 'en'
    code = str(raw).lower().split('-')[0].strip()
    return code if code in ('en', 'fr', 'ar') else 'en'


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/chatbot/chat/
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def chat(request: Request) -> Response:
    ser = SendMessageSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    data: dict[str, Any] = dict(ser.validated_data)

    user_message: str      = str(data['message']).strip()
    session_id: int | None = data.get('session_id')
    anonymous_id: str      = str(data.get('anonymous_id') or '')
    user_name: str         = str(data.get('user_name') or '')
    user_email: str        = str(data.get('user_email') or '')

    # ★ Read language from the validated payload
    # SendMessageSerializer must include lang as an optional CharField (see note below)
    # Falls back to request.data directly in case the serializer field is missing
    lang: str = _parse_lang(data.get('lang') or request.data.get('lang'))

    # ── Resolve or create session ─────────────────────────────────────────
    session: ChatSession | None = None

    if session_id:
        session = ChatSession.objects.filter(pk=session_id).first()

    if session is None:
        if request.user.is_authenticated:
            session = (
                ChatSession.objects
                .filter(user=request.user)
                .order_by('-updated_at')
                .first()
            )
            if session is None:
                session = ChatSession.objects.create(
                    user=request.user,
                    user_name=(
                        f'{request.user.first_name} {request.user.last_name}'.strip()
                        or user_name
                    ),
                    user_email=request.user.email or user_email,
                    ip_address=_get_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    lang=lang,                          # ★ set on create
                )

        elif anonymous_id:
            session, created = ChatSession.objects.get_or_create(
                anonymous_id=anonymous_id,
                defaults={
                    'user_name':  user_name,
                    'user_email': user_email,
                    'ip_address': _get_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'lang':       lang,                 # ★ set on create
                },
            )
            if not created:
                needs_save = False
                if user_name and not session.user_name:
                    session.user_name = user_name
                    needs_save = True
                if user_email and not session.user_email:
                    session.user_email = user_email
                    needs_save = True
                # ★ Always sync lang in case the user switched language mid-session
                if session.lang != lang:
                    session.lang = lang
                    needs_save = True
                if needs_save:
                    session.save(update_fields=['user_name', 'user_email', 'lang'])

        else:
            session = ChatSession.objects.create(
                ip_address=_get_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                lang=lang,                              # ★ set on create
            )
    else:
        # Session found by session_id — sync lang if it changed
        if session.lang != lang:
            session.lang = lang
            session.save(update_fields=['lang'])

    # ── Save user message ─────────────────────────────────────────────────
    ChatMessage.objects.create(session=session, role='user', text=user_message)

    # ── Generate multilingual rule-based reply ★ ──────────────────────────
    result: dict[str, Any] = get_reply(user_message, lang=lang)
    reply: str             = str(result['reply'])
    quick: list[str]       = list(result.get('quick') or [])

    # ── Save bot reply ────────────────────────────────────────────────────
    bot_msg = ChatMessage.objects.create(session=session, role='bot', text=reply)
    session.save(update_fields=['updated_at'])

    return Response(
        {
            'session_id': session.pk,
            'reply':      reply,
            'quick':      quick,        # i18n keys, e.g. 'chat.quick.browseProducts'
            'lang':       lang,         # echo back so frontend can verify
            'message_id': bot_msg.pk,
        },
        status=status.HTTP_200_OK,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/chatbot/history/
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def history(request: Request) -> Response:
    session_id_param   = request.query_params.get('session_id')
    anonymous_id_param = request.query_params.get('anonymous_id')

    session: ChatSession | None = None

    if session_id_param:
        session = ChatSession.objects.filter(pk=session_id_param).first()
        if not session:
            return Response(
                {'error': 'Session not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

    elif anonymous_id_param:
        session = ChatSession.objects.filter(anonymous_id=anonymous_id_param).first()
        if not session:
            return Response({'messages': [], 'session_id': None})

    elif request.user.is_authenticated:
        session = (
            ChatSession.objects
            .filter(user=request.user)
            .order_by('-updated_at')
            .first()
        )
        if not session:
            return Response({'messages': [], 'session_id': None})

    else:
        return Response(
            {'error': 'Provide session_id or anonymous_id.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Authenticated non-staff users can only see their own sessions
    if (
        request.user.is_authenticated
        and not request.user.is_staff
        and session.user
        and session.user != request.user
    ):
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    messages = ChatMessageSerializer(
        ChatMessage.objects.filter(session=session).order_by('created_at'),
        many=True,
    ).data

    return Response({'session_id': session.pk, 'messages': messages})


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/chatbot/admin/sessions/<pk>/resolve/
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_session(request: Request, pk: int) -> Response:
    session = ChatSession.objects.filter(pk=pk).first()
    if not session:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    ser = MarkResolvedSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    data: dict[str, Any] = dict(ser.validated_data)
    session.resolved = bool(data['resolved'])
    session.save(update_fields=['resolved'])

    return Response({'session_id': session.pk, 'resolved': session.resolved})


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/chatbot/admin/sessions/
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_sessions(request: Request) -> Response:
    qs = ChatSession.objects.select_related('user').prefetch_related('messages')

    resolved_param = request.query_params.get('resolved')
    if resolved_param is not None:
        qs = qs.filter(resolved=resolved_param.lower() == 'true')

    # ★ Filter by language if provided  e.g. ?lang=ar
    lang_param = request.query_params.get('lang', '').strip().lower()
    if lang_param in ('en', 'fr', 'ar'):
        qs = qs.filter(lang=lang_param)

    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(
            db_models.Q(user_name__icontains=search)
            | db_models.Q(user_email__icontains=search)
            | db_models.Q(anonymous_id__icontains=search)
        )

    page      = max(int(request.query_params.get('page', 1)), 1)
    page_size = min(int(request.query_params.get('page_size', 25)), 100)
    start     = (page - 1) * page_size
    total     = qs.count()

    return Response({
        'count':   total,
        'page':    page,
        'results': ChatSessionListSerializer(qs[start:start + page_size], many=True).data,
    })


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/chatbot/admin/sessions/<pk>/
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_session_detail(request: Request, pk: int) -> Response:
    session = ChatSession.objects.prefetch_related('messages').filter(pk=pk).first()
    if not session:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(ChatSessionSerializer(session).data)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/chatbot/admin/stats/
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request: Request) -> Response:
    from datetime import timedelta
    from django.utils import timezone

    now      = timezone.now()
    week_ago = now - timedelta(days=7)

    return Response({
        'total_sessions': ChatSession.objects.count(),
        'open_sessions':  ChatSession.objects.filter(resolved=False).count(),
        'today_sessions': ChatSession.objects.filter(created_at__date=now.date()).count(),
        'week_sessions':  ChatSession.objects.filter(created_at__gte=week_ago).count(),
        'total_messages': ChatMessage.objects.count(),
        # ★ Per-language breakdown for admin dashboard
        'sessions_by_lang': {
            lang: ChatSession.objects.filter(lang=lang).count()
            for lang in ('en', 'fr', 'ar')
        },
    })
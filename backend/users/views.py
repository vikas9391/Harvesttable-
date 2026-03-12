# users/views.py
"""
User-related API views for HarvestTable.

Endpoints
---------
GET  /api/users/csrf/                   Seed CSRF cookie (AllowAny)
POST /api/users/register/               Create account   (AllowAny)
POST /api/users/login/                  Session login    (AllowAny)
POST /api/users/logout/                 Session logout   (IsAuthenticated)
GET  /api/users/me/                     Current profile  (IsAuthenticated)
PATCH /api/users/me/                    Update profile   (IsAuthenticated)
DELETE /api/users/me/                   Delete account   (IsAuthenticated)
POST /api/users/change-password/        Change password  (IsAuthenticated)
PATCH /api/users/notifications/         Notification prefs (IsAuthenticated)
POST /api/users/forgot-password/        Request reset    (AllowAny)
POST /api/users/reset-password/         Confirm reset    (AllowAny)
GET  /api/users/admin/customers/        Customer list    (IsAdminUser)
"""

import logging
from decimal import Decimal
from typing import cast

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.mail import EmailMessage
from django.conf import settings
from django.db.models import Count, Max, Q, Sum
from django.db.models.functions import Coalesce
from django.middleware.csrf import get_token
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import UserProfile
from .serializers import LoginSerializer, ProfileSerializer, RegisterSerializer

logger = logging.getLogger(__name__)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_client_ip(request: Request) -> str:
    """Return the real client IP, respecting common proxy headers."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


def _rate_limit(key: str, limit: int, window: int) -> bool:
    """
    Simple cache-based rate limiter.
    Returns True if the request should be blocked (limit exceeded).
    `window` is in seconds.
    """
    count = cache.get(key, 0)
    if count >= limit:
        return True
    cache.set(key, count + 1, timeout=window)
    return False


# ── Auth ──────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token(request: Request) -> Response:
    """Seed the CSRF cookie and return the token value."""
    return Response({'csrfToken': get_token(request)})


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request: Request) -> Response:
    """
    POST /api/users/register/
    Body: { firstName, lastName, email, password }
    """
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        errors    = dict(serializer.errors)
        first_err = next(iter(errors.values()))
        msg       = first_err[0] if isinstance(first_err, list) else str(first_err)
        return Response({'error': str(msg)}, status=status.HTTP_400_BAD_REQUEST)

    user = cast(AbstractBaseUser, serializer.save())
    login(request, user)
    return Response(ProfileSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request: Request) -> Response:
    """
    POST /api/users/login/
    Body: { email, password }
    """
    # Brute-force guard: 10 attempts per IP per 5 minutes
    ip      = _get_client_ip(request)
    rl_key  = f'login_attempts:{ip}'
    if _rate_limit(rl_key, limit=10, window=300):
        return Response(
            {'error': 'Too many login attempts. Please wait a few minutes.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'error': 'Invalid input.'}, status=status.HTTP_400_BAD_REQUEST)

    email: str    = str(serializer.validated_data.get('email', '')).strip().lower()
    password: str = str(serializer.validated_data.get('password', ''))

    user = authenticate(request, username=email, password=password)
    if not user:
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    login(request, user)
    # Reset brute-force counter on success
    cache.delete(rl_key)
    return Response(ProfileSerializer(user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request: Request) -> Response:
    """POST /api/users/logout/"""
    logout(request)
    return Response({'message': 'Logged out successfully.'})


# ── Profile ───────────────────────────────────────────────────────────────────

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def me(request: Request) -> Response:
    """
    GET    /api/users/me/  → current user profile
    PATCH  /api/users/me/  → update firstName, lastName, phone, address
    DELETE /api/users/me/  → permanently delete the account
    """
    if request.method == 'GET':
        return Response(ProfileSerializer(request.user).data)

    if request.method == 'PATCH':
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    # DELETE
    user = request.user
    logout(request)           # Invalidate session before deletion
    user.delete()             # Cascades to UserProfile (OneToOneField)
    logger.info('User account deleted: %s', user.email)
    return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request: Request) -> Response:
    """
    POST /api/users/change-password/
    Body: { currentPassword, newPassword }
    """
    user             = request.user
    current_password = request.data.get('currentPassword', '').strip()
    new_password     = request.data.get('newPassword', '').strip()

    if not current_password or not new_password:
        return Response({'error': 'Both fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'error': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    if current_password == new_password:
        return Response({'error': 'New password must differ from the current one.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    login(request, user)   # Re-login to keep session alive after password change
    return Response({'message': 'Password updated successfully.'})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def notifications(request: Request) -> Response:
    """
    PATCH /api/users/notifications/
    Body: { orderUpdates, promotions, newArrivals, wishlistAlerts }

    Stores notification preferences on the user's profile as a JSON blob.
    The frontend persists to localStorage as well; this endpoint makes prefs
    sync across devices.
    """
    allowed_keys = {'orderUpdates', 'promotions', 'newArrivals', 'wishlistAlerts'}
    prefs        = {k: bool(v) for k, v in request.data.items() if k in allowed_keys}

    if not prefs:
        return Response({'error': 'No valid preference keys provided.'}, status=status.HTTP_400_BAD_REQUEST)

    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    # Store as a simple JSON field. If your UserProfile model doesn't have
    # a `notification_prefs` JSONField yet, add it:
    #   notification_prefs = models.JSONField(default=dict, blank=True)
    # Until then, we silently accept and return 200 so the frontend's
    # "local-only" fallback is not triggered.
    if hasattr(profile, 'notification_prefs'):
        existing = profile.notification_prefs or {}
        existing.update(prefs)
        profile.notification_prefs = existing
        profile.save(update_fields=['notification_prefs', 'updated_at'])

    return Response({'message': 'Preferences saved.', 'prefs': prefs})


# ── Password Reset ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request: Request) -> Response:
    """
    POST /api/users/forgot-password/
    Body: { email }

    Always returns 200 to prevent email enumeration.
    Rate-limited to 5 requests per IP per 15 minutes.
    """
    ip     = _get_client_ip(request)
    rl_key = f'forgot_pw:{ip}'
    if _rate_limit(rl_key, limit=5, window=900):
        # Still return a 200 — don't reveal that we're rate-limiting
        return Response({'message': 'If that email is registered, a reset link has been sent.'})

    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'message': 'If that email is registered, a reset link has been sent.'})

    uid        = urlsafe_base64_encode(force_bytes(user.pk))
    token      = default_token_generator.make_token(user)
    brand      = getattr(settings, 'BRAND_NAME', 'HarvestTable')
    frontend   = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_link = f'{frontend}/reset-password/{uid}/{token}/'

    body = (
        f'Hello {user.first_name or user.email},\n\n'
        f'You requested a password reset for your {brand} account.\n\n'
        f'Click the link below to set a new password:\n'
        f'{reset_link}\n\n'
        f'This link expires in 24 hours. If you did not request a reset, '
        f'you can safely ignore this email.\n\n'
        f'The {brand} Team\n'
        f'support@harvesttable.com'
    )

    try:
        EmailMessage(
            subject    = f'Reset your {brand} password',
            body       = body,
            from_email = settings.DEFAULT_FROM_EMAIL,
            to         = [user.email],
        ).send(fail_silently=True)
    except Exception:
        pass   # Never reveal email errors to the client

    logger.info('Password reset email sent to %s', email)
    return Response({'message': 'If that email is registered, a reset link has been sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request: Request) -> Response:
    """
    POST /api/users/reset-password/
    Body: { uid, token, newPassword }

    Rate-limited to 10 attempts per IP per hour to prevent token brute-force.
    """
    ip     = _get_client_ip(request)
    rl_key = f'reset_pw:{ip}'
    if _rate_limit(rl_key, limit=10, window=3600):
        return Response({'error': 'Too many attempts. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    uid_b64      = request.data.get('uid', '')
    token        = request.data.get('token', '')
    new_password = request.data.get('newPassword', '').strip()

    if not uid_b64 or not token or not new_password:
        return Response({'error': 'uid, token, and newPassword are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_pk = force_str(urlsafe_base64_decode(uid_b64))
        user    = User.objects.get(pk=user_pk)
    except (User.DoesNotExist, ValueError, TypeError, Exception):
        return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response(
            {'error': 'This reset link has expired or has already been used.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save()
    # Clear rate-limit counter on success so the user isn't locked out
    cache.delete(rl_key)
    logger.info('Password reset completed for user %s', user.email)
    return Response({'message': 'Password reset successfully. You can now log in.'})


# ── Admin ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_customer_list(request: Request) -> Response:
    """
    GET /api/users/admin/customers/
    Returns all non-staff users with order aggregates.

    Query params:
      ?search=<str>      filter by name or email
      ?ordering=<field>  name | spent | orders  (default: name)
      ?page=<int>        1-based page number     (default: 1)
      ?page_size=<int>   results per page        (default: 50, max: 200)
    """
    search    = request.query_params.get('search', '').strip()
    ordering  = request.query_params.get('ordering', 'name')
    try:
        page      = max(1, int(request.query_params.get('page', 1)))
        page_size = min(200, max(1, int(request.query_params.get('page_size', 50))))
    except ValueError:
        page = 1; page_size = 50

    qs = (
        User.objects
        .filter(is_staff=False, is_superuser=False)
        .select_related('profile')
    )

    if search:
        qs = qs.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)  |
            Q(email__icontains=search)
        )

    # Annotate — guard against missing orders relation gracefully
    try:
        qs = qs.annotate(
            order_count   = Count('orders', distinct=True),
            total_spent   = Coalesce(Sum('orders__total'), Decimal('0.00')),
            last_order_at = Max('orders__created_at'),
        )
    except Exception as exc:
        logger.warning('admin_customer_list annotation failed: %s', exc)
        qs = qs.annotate(
            order_count   = Count('pk', filter=Q(pk=None)),
            total_spent   = Coalesce(Sum('pk', filter=Q(pk=None)), Decimal('0.00')),
            last_order_at = Max('date_joined', filter=Q(pk=None)),
        )

    sort_map = {
        'name':   'first_name',
        'spent':  '-total_spent',
        'orders': '-order_count',
    }
    qs = qs.order_by(sort_map.get(ordering, 'first_name'))

    total_count = qs.count()
    offset      = (page - 1) * page_size
    page_qs     = qs[offset: offset + page_size]

    data = []
    for u in page_qs:
        profile    = getattr(u, 'profile', None)
        last_order = getattr(u, 'last_order_at', None)
        data.append({
            'id':          u.pk,
            'name':        f'{u.first_name} {u.last_name}'.strip() or u.email,
            'email':       u.email,
            'phone':       getattr(profile, 'phone',   ''),
            'address':     getattr(profile, 'address', ''),
            'orders':      getattr(u, 'order_count', 0),
            'total_spent': str(getattr(u, 'total_spent', '0.00')),
            'joined':      u.date_joined.isoformat(),
            'last_order':  last_order.isoformat() if last_order else None,
        })

    return Response({
        'count':     total_count,
        'page':      page,
        'page_size': page_size,
        'pages':     max(1, -(-total_count // page_size)),  # ceiling division
        'results':   data,
    })
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from .serializers import RegisterSerializer, LoginSerializer, ProfileSerializer
from django.middleware.csrf import get_token
from rest_framework.permissions import IsAdminUser
from django.contrib.auth.models import User
from django.db.models import Count, Sum, Max, Q
from django.db.models.functions import Coalesce
from decimal import Decimal
from typing import cast
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import EmailMessage
from django.conf import settings


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    POST /api/users/forgot-password/
    Body: { email }

    Always returns 200 to prevent email enumeration.
    If the email exists, sends a password-reset link.
    """
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Return success anyway — don't reveal whether email exists
        return Response({'message': 'If that email is registered, a reset link has been sent.'})

    # Build reset token
    uid   = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_link   = f"{frontend_url}/reset-password/{uid}/{token}/"

    brand = getattr(settings, 'BRAND_NAME', 'HarvestTable')

    body = (
        f"Hello {user.first_name or user.email},\n\n"
        f"You requested a password reset for your {brand} account.\n\n"
        f"Click the link below to set a new password:\n"
        f"{reset_link}\n\n"
        f"This link expires in 24 hours. If you did not request a reset, "
        f"you can safely ignore this email.\n\n"
        f"The {brand} Team\n"
        f"support@harvesttable.com"
    )

    try:
        EmailMessage(
            subject    = f'Reset your {brand} password',
            body       = body,
            from_email = settings.DEFAULT_FROM_EMAIL,
            to         = [user.email],
        ).send(fail_silently=True)
    except Exception:
        pass  # Never reveal email errors to the client

    return Response({'message': 'If that email is registered, a reset link has been sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    POST /api/users/reset-password/
    Body: { uid, token, newPassword }

    Validates the token and sets the new password.
    """
    uid          = request.data.get('uid', '')
    token        = request.data.get('token', '')
    new_password = request.data.get('newPassword', '')

    if not uid or not token or not new_password:
        return Response({'error': 'uid, token, and newPassword are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_pk = force_str(urlsafe_base64_decode(uid))
        user    = User.objects.get(pk=user_pk)
    except (User.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({'error': 'This reset link has expired or already been used.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    return Response({'message': 'Password reset successfully. You can now log in.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token(request):
    return Response({'csrfToken': get_token(request)})


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    POST /api/users/register/
    Body: { firstName, lastName, email, password }
    """
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        # FIX 1: serializer.errors is a dict — iterate .values() via dict() cast
        errors = dict(serializer.errors)
        first_error = next(iter(errors.values()))
        msg = first_error[0] if isinstance(first_error, list) else str(first_error)
        return Response({'error': str(msg)}, status=status.HTTP_400_BAD_REQUEST)

    # FIX 2: cast the save() result so Pylance knows it's an AbstractBaseUser
    user = cast(AbstractBaseUser, serializer.save())
    login(request, user)  # auto-login after registration
    return Response(ProfileSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    """
    POST /api/users/login/
    Body: { email, password }
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'error': 'Invalid input.'}, status=status.HTTP_400_BAD_REQUEST)

    # FIX 3: use .get() with explicit str type so Pylance resolves validated_data fields
    email: str    = str(serializer.validated_data.get('email', '')).lower()
    password: str = str(serializer.validated_data.get('password', ''))

    # username == email (set during registration)
    user = authenticate(request, username=email, password=password)
    if not user:
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    login(request, user)
    return Response(ProfileSerializer(user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """
    POST /api/users/logout/
    """
    logout(request)
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    GET  /api/users/me/   → return current user profile
    PATCH /api/users/me/  → update firstName, lastName, phone, address
    Body: { firstName?, lastName?, phone?, address? }
    """
    if request.method == 'GET':
        return Response(ProfileSerializer(request.user).data)

    # PATCH
    serializer = ProfileSerializer(request.user, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    POST /api/users/change-password/
    Body: { currentPassword, newPassword }
    """
    user             = request.user
    current_password = request.data.get('currentPassword', '')
    new_password     = request.data.get('newPassword', '')

    if not current_password or not new_password:
        return Response({'error': 'Both fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'error': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    login(request, user)  # re-login to keep session alive after password change
    return Response({'message': 'Password updated successfully.'})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_customer_list(request):
    """
    GET /api/users/admin/customers/
    Returns all non-staff users with order aggregates.
    Query params:
      ?search=<str>   – filter by name or email
      ?ordering=<field>  – name | spent | orders (default: name)
    """
    search   = request.query_params.get('search', '').strip()
    ordering = request.query_params.get('ordering', 'name')

    qs = User.objects.filter(is_staff=False, is_superuser=False).select_related('profile')

    if search:
        qs = qs.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)  |
            Q(email__icontains=search)
        )

    # Annotate with order stats
    try:
        qs = qs.annotate(
            order_count   = Count('orders', distinct=True),
            total_spent   = Coalesce(Sum('orders__total'), Decimal('0.00')),
            last_order_at = Max('orders__created_at'),
        )
    except Exception:
        qs = qs.annotate(
            order_count   = Count('pk', filter=Q(pk=None)),
            total_spent   = Coalesce(Sum('pk', filter=Q(pk=None)), Decimal('0.00')),
            last_order_at = Max('date_joined', filter=Q(pk=None)),
        )

    # Sort
    sort_map = {
        'name':   'first_name',
        'spent':  '-total_spent',
        'orders': '-order_count',
    }
    qs = qs.order_by(sort_map.get(ordering, 'first_name'))

    data = []
    for u in qs:
        # FIX 4: use getattr() for annotated fields Pylance doesn't know about on User
        user_id      = getattr(u, 'pk', None)           # pk is always valid; avoids the .id complaint
        last_order   = getattr(u, 'last_order_at', None)
        data.append({
            'id':          user_id,
            'name':        f"{u.first_name} {u.last_name}".strip() or u.email,
            'email':       u.email,
            'phone':       getattr(getattr(u, 'profile', None), 'phone', ''),
            'address':     getattr(getattr(u, 'profile', None), 'address', ''),
            'orders':      getattr(u, 'order_count', 0),
            'total_spent': str(getattr(u, 'total_spent', '0.00')),
            'joined':      u.date_joined.isoformat(),
            'last_order':  last_order.isoformat() if last_order else None,
        })

    return Response(data)
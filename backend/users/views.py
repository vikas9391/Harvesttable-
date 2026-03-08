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
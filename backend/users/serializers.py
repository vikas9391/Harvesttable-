# users/serializers.py
import logging

from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserProfile

logger = logging.getLogger(__name__)


# ── Register ──────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=150)
    lastName  = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email     = serializers.EmailField()
    password  = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value: str) -> str:
        normalised = value.strip().lower()
        if User.objects.filter(email__iexact=normalised).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return normalised

    def validate_firstName(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError('First name cannot be blank.')
        return value

    def create(self, validated_data: dict) -> User:
        email = validated_data['email']
        user  = User.objects.create_user(
            username   = email,
            email      = email,
            password   = validated_data['password'],
            first_name = validated_data['firstName'],
            last_name  = validated_data.get('lastName', '').strip(),
        )
        # Ensure profile exists; signal may have already created it.
        UserProfile.objects.get_or_create(user=user)
        logger.info('New user registered: %s', email)
        return user


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# ── Profile ───────────────────────────────────────────────────────────────────

class ProfileSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name')
    lastName  = serializers.CharField(source='last_name', allow_blank=True)
    phone     = serializers.CharField(source='profile.phone',   allow_blank=True, required=False)
    address   = serializers.CharField(source='profile.address', allow_blank=True, required=False)
    isAdmin   = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'isAdmin']
        read_only_fields = ['email']

    def get_isAdmin(self, obj: User) -> bool:
        return bool(obj.is_staff or obj.is_superuser)

    def update(self, instance: User, validated_data: dict) -> User:
        profile_data = validated_data.pop('profile', {})

        instance.first_name = validated_data.get('first_name', instance.first_name).strip()
        instance.last_name  = validated_data.get('last_name',  instance.last_name).strip()
        instance.save(update_fields=['first_name', 'last_name'])

        # Safely fetch or create profile in case signal hasn't run yet
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        if 'phone' in profile_data:
            profile.phone   = profile_data['phone']
        if 'address' in profile_data:
            profile.address = profile_data['address']
        profile.save(update_fields=['phone', 'address', 'updated_at'])

        return instance
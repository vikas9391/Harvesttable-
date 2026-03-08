from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile


class RegisterSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=150)
    lastName  = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email     = serializers.EmailField()
    password  = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        user = User.objects.create_user(
            username   = validated_data['email'].lower(),
            email      = validated_data['email'].lower(),
            password   = validated_data['password'],
            first_name = validated_data['firstName'],
            last_name  = validated_data.get('lastName', ''),
        )
        UserProfile.objects.get_or_create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ProfileSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name')
    lastName  = serializers.CharField(source='last_name')
    phone     = serializers.CharField(source='profile.phone', allow_blank=True)
    address   = serializers.CharField(source='profile.address', allow_blank=True)
    # True when the user has staff or superuser privileges (set via Django admin or createsuperuser)
    isAdmin   = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'isAdmin']

    def get_isAdmin(self, obj) -> bool:
        return obj.is_staff or obj.is_superuser

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name  = validated_data.get('last_name',  instance.last_name)
        instance.save()

        profile = instance.profile
        profile.phone   = profile_data.get('phone',   profile.phone)
        profile.address = profile_data.get('address', profile.address)
        profile.save()
        return instance
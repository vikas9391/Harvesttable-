# users/models.py
from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone      = models.CharField(max_length=30, blank=True)
    address    = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self) -> str:
        return f'Profile({self.user.email})'
# users/signals.py
import logging

from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance: User, created: bool, **kwargs) -> None:
    """
    Auto-create a UserProfile whenever a new User is saved.
    Uses get_or_create so it is safe even if the profile already exists
    (e.g. created by RegisterSerializer before the signal fires).
    """
    if created:
        _, was_created = UserProfile.objects.get_or_create(user=instance)
        if was_created:
            logger.debug('Created UserProfile for %s', instance.email)
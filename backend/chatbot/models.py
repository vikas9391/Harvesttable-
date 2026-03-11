# chatbot/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatSession(models.Model):
    """
    One conversation per visitor.
    Linked to a User if logged in, otherwise tracked by anonymous_id (UUID from localStorage).
    """
    user         = models.ForeignKey(
        User,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='chat_sessions',
    )
    anonymous_id = models.CharField(max_length=128, blank=True, db_index=True)

    # Snapshot of visitor info at session creation time
    user_name    = models.CharField(max_length=255, blank=True)
    user_email   = models.EmailField(blank=True)

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    ip_address   = models.GenericIPAddressField(null=True, blank=True)
    user_agent   = models.TextField(blank=True)
    resolved     = models.BooleanField(default=False)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        who = self.user_name or self.user_email or self.anonymous_id or 'anonymous'
        return f'Session {self.pk} — {who}'


class ChatMessage(models.Model):
    ROLE_CHOICES = [('user', 'User'), ('bot', 'Bot')]

    session    = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES)
    text       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        preview = self.text[:60] + ('…' if len(self.text) > 60 else '')
        return f'[{self.role}] {preview}'
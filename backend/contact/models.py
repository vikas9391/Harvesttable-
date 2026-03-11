# contact/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ContactMessage(models.Model):
    """
    Stores every message submitted via the Contact page.
    """
    STATUS_CHOICES = [
        ('new',         'New'),
        ('in_progress', 'In Progress'),
        ('resolved',    'Resolved'),
        ('spam',        'Spam'),
    ]

    LANG_CHOICES = [
        ('en', 'English'),
        ('fr', 'Français'),
        ('ar', 'العربية'),
    ]

    # ── Submitted fields (mirror the React form) ───────────────────────────
    name       = models.CharField(max_length=255)
    email      = models.EmailField()
    subject    = models.CharField(max_length=500)
    message    = models.TextField()

    # ── Language the visitor was using ────────────────────────────────────
    lang       = models.CharField(
        max_length=5,
        choices=LANG_CHOICES,
        default='en',
        blank=True,
    )

    # ── Linked user account (if logged in) ────────────────────────────────
    user       = models.ForeignKey(
        User,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='contact_messages',
    )

    # ── Admin workflow ────────────────────────────────────────────────────
    status     = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        db_index=True,
    )
    admin_note = models.TextField(blank=True)   # internal notes for staff

    # ── Meta ──────────────────────────────────────────────────────────────
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.status.upper()}] {self.name} — {self.subject[:60]}'

    @property
    def is_new(self) -> bool:
        return self.status == 'new'
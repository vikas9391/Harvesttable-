# contact/serializers.py
from rest_framework import serializers
from .models import ContactMessage


class ContactFormSerializer(serializers.Serializer):
    """
    Validates the form payload sent by the React Contact page.
    Mirrors exactly: name, email, subject, message  (+optional lang).
    """
    name    = serializers.CharField(min_length=1, max_length=255)
    email   = serializers.EmailField()
    subject = serializers.CharField(min_length=1, max_length=500)
    message = serializers.CharField(min_length=1, max_length=5000)
    # Optional — the React frontend can send the current UI language
    lang    = serializers.CharField(
        required=False, allow_blank=True, default='en', max_length=10,
    )


class ContactMessageSerializer(serializers.ModelSerializer):
    """
    Full read serializer — used by admin endpoints.
    """
    class Meta:
        model  = ContactMessage
        fields = [
            'id', 'name', 'email', 'subject', 'message',
            'lang', 'user', 'status', 'admin_note',
            'ip_address', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'ip_address']


class ContactMessageListSerializer(serializers.ModelSerializer):
    """
    Lightweight list serializer — used by the admin list endpoint.
    """
    preview = serializers.SerializerMethodField()

    class Meta:
        model  = ContactMessage
        fields = [
            'id', 'name', 'email', 'subject', 'preview',
            'lang', 'status', 'created_at',
        ]

    def get_preview(self, obj: ContactMessage) -> str:
        return obj.message[:120] + ('…' if len(obj.message) > 120 else '')


class UpdateStatusSerializer(serializers.Serializer):
    STATUS_CHOICES = ['new', 'in_progress', 'resolved', 'spam']
    status     = serializers.ChoiceField(choices=STATUS_CHOICES)
    admin_note = serializers.CharField(required=False, allow_blank=True, default='')
# chatbot/serializers.py
from rest_framework import serializers
from .models import ChatSession, ChatMessage


class SendMessageSerializer(serializers.Serializer):
    message      = serializers.CharField(min_length=1, max_length=2000)
    session_id   = serializers.IntegerField(required=False, allow_null=True)
    anonymous_id = serializers.CharField(required=False, allow_blank=True, default='')
    user_name    = serializers.CharField(required=False, allow_blank=True, default='')
    user_email   = serializers.EmailField(required=False, allow_blank=True, default='')
    # Language sent by the React frontend ('en' | 'fr' | 'ar')
    lang         = serializers.CharField(required=False, allow_blank=True, default='en', max_length=10)


class MarkResolvedSerializer(serializers.Serializer):
    resolved = serializers.BooleanField()


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ChatMessage
        fields = ['id', 'role', 'text', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model  = ChatSession
        fields = [
            'id', 'user', 'anonymous_id',
            'user_name', 'user_email',
            'lang',
            'resolved',
            'ip_address', 'user_agent',
            'created_at', 'updated_at',
            'messages',
        ]


class ChatSessionListSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model  = ChatSession
        fields = [
            'id', 'user', 'anonymous_id',
            'user_name', 'user_email',
            'lang',
            'resolved', 'message_count',
            'created_at', 'updated_at',
        ]
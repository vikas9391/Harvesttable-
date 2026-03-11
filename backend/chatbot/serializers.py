# chatbot/serializers.py
from rest_framework import serializers
from .models import ChatSession, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ChatMessage
        fields = ['id', 'role', 'text', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages      = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model  = ChatSession
        fields = [
            'id', 'user', 'anonymous_id', 'user_name', 'user_email',
            'created_at', 'updated_at', 'ip_address', 'resolved',
            'message_count', 'messages',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'ip_address']


class ChatSessionListSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(source='messages.count', read_only=True)
    last_message  = serializers.SerializerMethodField()

    class Meta:
        model  = ChatSession
        fields = [
            'id', 'user', 'anonymous_id', 'user_name', 'user_email',
            'created_at', 'updated_at', 'resolved',
            'message_count', 'last_message',
        ]

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'role': msg.role, 'text': msg.text[:120], 'created_at': msg.created_at}
        return None


class SendMessageSerializer(serializers.Serializer):
    session_id   = serializers.IntegerField(required=False, allow_null=True)
    anonymous_id = serializers.CharField(max_length=128, required=False, allow_blank=True)
    message      = serializers.CharField()
    user_name    = serializers.CharField(max_length=255, required=False, allow_blank=True)
    user_email   = serializers.EmailField(required=False, allow_blank=True)


class MarkResolvedSerializer(serializers.Serializer):
    resolved = serializers.BooleanField()
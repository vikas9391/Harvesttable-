# chatbot/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import ChatSession, ChatMessage


class ChatMessageInline(admin.TabularInline):
    model           = ChatMessage
    extra           = 0
    readonly_fields = ['role', 'text', 'created_at']
    can_delete      = False
    ordering        = ['created_at']

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display    = ['id', 'display_who', 'message_count', 'resolved', 'ip_address', 'created_at', 'updated_at']
    list_filter     = ['resolved', 'created_at']
    search_fields   = ['user__email', 'user_name', 'user_email', 'anonymous_id']
    readonly_fields = ['created_at', 'updated_at', 'ip_address', 'user_agent', 'anonymous_id']
    inlines         = [ChatMessageInline]
    ordering        = ['-updated_at']
    actions         = ['mark_resolved', 'mark_unresolved']

    @admin.display(description='User')
    def display_who(self, obj):
        if obj.user:
            return format_html('<strong>{}</strong> <span style="color:#888">({})</span>',
                               obj.user.get_full_name() or obj.user.username, obj.user.email)
        if obj.user_name or obj.user_email:
            return format_html('{} <span style="color:#888">{}</span>', obj.user_name, obj.user_email)
        return format_html('<span style="color:#aaa">Anonymous — {}</span>',
                           obj.anonymous_id[:16] if obj.anonymous_id else 'unknown')

    @admin.display(description='Messages')
    def message_count(self, obj):
        return obj.messages.count()

    @admin.action(description='Mark selected as resolved')
    def mark_resolved(self, request, queryset):
        queryset.update(resolved=True)

    @admin.action(description='Mark selected as unresolved')
    def mark_unresolved(self, request, queryset):
        queryset.update(resolved=False)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display    = ['id', 'session', 'role', 'short_text', 'created_at']
    list_filter     = ['role', 'created_at']
    search_fields   = ['text', 'session__user__email', 'session__user_name']
    readonly_fields = ['session', 'role', 'text', 'created_at']
    ordering        = ['-created_at']

    @admin.display(description='Message')
    def short_text(self, obj):
        return obj.text[:80] + ('…' if len(obj.text) > 80 else '')

    def has_add_permission(self, request):
        return False
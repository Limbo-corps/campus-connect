from django.contrib import admin

from chat.models import (
    Conversation,
    ConversationParticipant,
    Message,
    MessageReaction,
)


class ConversationParticipantInline(admin.TabularInline):
    model = ConversationParticipant
    extra = 0
    raw_id_fields = ["user", "last_read_message"]


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ["id", "is_group", "name", "owner", "updated_at"]
    list_filter = ["is_group", "created_at"]
    search_fields = ["name", "owner__username"]
    raw_id_fields = ["owner", "last_message"]
    inlines = [ConversationParticipantInline]
    date_hierarchy = "created_at"


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["id", "conversation", "sender", "type", "created_at", "deleted_at"]
    list_filter = ["type", "created_at"]
    search_fields = ["content", "sender__username"]
    raw_id_fields = ["conversation", "sender", "reply_to"]
    date_hierarchy = "created_at"


@admin.register(MessageReaction)
class MessageReactionAdmin(admin.ModelAdmin):
    list_display = ["id", "message", "user", "emoji", "created_at"]
    search_fields = ["emoji", "user__username"]
    raw_id_fields = ["message", "user"]

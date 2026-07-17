from rest_framework import serializers

from chat.models import Conversation, ConversationParticipant, Message
from chat.selectors.message_selector import MessageSelector


class ChatUserSerializer(serializers.Serializer):
    """Lightweight user representation embedded in chat payloads."""

    id = serializers.UUIDField(read_only=True)
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    avatar_url = serializers.CharField(read_only=True)


class MessageReplyPreviewSerializer(serializers.ModelSerializer):
    """Shallow preview of the message a reply points to (no recursion)."""

    sender = ChatUserSerializer(read_only=True)
    is_deleted = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "sender", "type", "content", "is_deleted"]

    def get_is_deleted(self, obj) -> bool:
        return obj.deleted_at is not None


class MessageSerializer(serializers.ModelSerializer):
    sender = ChatUserSerializer(read_only=True)
    reply_to = MessageReplyPreviewSerializer(read_only=True)
    attachment_url = serializers.SerializerMethodField()
    is_deleted = serializers.SerializerMethodField()
    is_edited = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "type",
            "content",
            "attachment_url",
            "reply_to",
            "edited_at",
            "deleted_at",
            "is_deleted",
            "is_edited",
            "reactions",
            "created_at",
        ]
        read_only_fields = fields

    def get_reactions(self, obj) -> list[dict]:
        """Reactions grouped by emoji: [{emoji, count, user_ids}].

        This is viewer-agnostic on purpose — the same payload is broadcast to
        every participant, and each client derives its own "reacted" state from
        ``user_ids`` so a broadcast never leaks the actor's perspective.
        """
        grouped: dict[str, dict] = {}
        for reaction in obj.reactions.all():
            entry = grouped.setdefault(
                reaction.emoji,
                {"emoji": reaction.emoji, "count": 0, "user_ids": []},
            )
            entry["count"] += 1
            entry["user_ids"].append(str(reaction.user_id))

        return list(grouped.values())

    def get_attachment_url(self, obj) -> str | None:
        if not obj.attachment:
            return None
        request = self.context.get("request")
        url = obj.attachment.url
        return request.build_absolute_uri(url) if request else url

    def get_is_deleted(self, obj) -> bool:
        return obj.deleted_at is not None

    def get_is_edited(self, obj) -> bool:
        return obj.edited_at is not None


class ParticipantSerializer(serializers.ModelSerializer):
    user = ChatUserSerializer(read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = [
            "user",
            "is_admin",
            "joined_at",
            "is_muted",
            "is_pinned",
            "is_archived",
            "last_read_message",
        ]


class ConversationSerializer(serializers.ModelSerializer):
    owner = ChatUserSerializer(read_only=True)
    participants_detail = ParticipantSerializer(
        source="memberships",
        many=True,
        read_only=True,
    )
    last_message = MessageSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "is_group",
            "name",
            "display_name",
            "image_url",
            "owner",
            "participants_detail",
            "other_user",
            "last_message",
            "unread_count",
            "created_at",
            "updated_at",
        ]

    def _current_user(self):
        request = self.context.get("request")
        return getattr(request, "user", None)

    def get_image_url(self, obj) -> str | None:
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

    def get_unread_count(self, obj) -> int:
        user = self._current_user()
        if user is None or user.is_anonymous:
            return 0
        try:
            return MessageSelector.unread_count(obj, user)
        except ConversationParticipant.DoesNotExist:
            return 0

    def _other_membership(self, obj):
        """For a direct conversation, the membership that is not the viewer."""
        user = self._current_user()
        memberships = list(obj.memberships.all())
        for membership in memberships:
            if user is None or membership.user_id != getattr(user, "id", None):
                return membership
        return memberships[0] if memberships else None

    def get_other_user(self, obj) -> dict | None:
        if obj.is_group:
            return None
        membership = self._other_membership(obj)
        if membership is None:
            return None
        return ChatUserSerializer(membership.user).data

    def get_display_name(self, obj) -> str:
        if obj.is_group:
            return obj.name or "Group chat"
        membership = self._other_membership(obj)
        if membership is None:
            return "Conversation"
        user = membership.user
        full = f"{user.first_name} {user.last_name}".strip()
        return full or user.username

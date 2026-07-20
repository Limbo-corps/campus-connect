from django.utils import timezone
import uuid

from django.conf import settings
from django.db import models


class Conversation(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    is_group = models.BooleanField(default=False)

    name = models.CharField(
        max_length=255,
        blank=True,
    )

    image = models.ImageField(
        upload_to="chat/groups/",
        blank=True,
        null=True,
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_conversations",
    )

    last_message = models.ForeignKey(
        "Message",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="ConversationParticipant",
        related_name="conversations",
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_conversations"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["updated_at"]),
        ]

    def __str__(self) -> str:
        if self.is_group:
            return self.name or f"Group {self.pk}"

        return f"Conversation {self.pk}"


class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="memberships",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversation_memberships",
    )

    is_admin = models.BooleanField(default=False)

    joined_at = models.DateTimeField(auto_now_add=True)

    is_muted = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)

    last_read_message = models.ForeignKey(
        "Message",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    class Meta:
        db_table = "chat_conversation_participants"
        ordering = ["joined_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "user"],
                name="unique_conversation_participant",
            )
        ]

        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["conversation"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} → {self.conversation}"


class Message(models.Model):
    class MessageType(models.TextChoices):
        TEXT = "TEXT", "Text"
        IMAGE = "IMAGE", "Image"
        VIDEO = "VIDEO", "Video"
        AUDIO = "AUDIO", "Audio"
        FILE = "FILE", "File"
        SYSTEM = "SYSTEM", "System"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )

    type = models.CharField(
        max_length=20,
        choices=MessageType.choices,
        default=MessageType.TEXT,
    )

    content = models.TextField(
        blank=True,
    )

    attachment = models.FileField(
        upload_to="chat/messages/",
        blank=True,
        null=True,
    )

    reply_to = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="replies",
    )

    edited_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "chat_messages"
        ordering = ["created_at"]

        indexes = [
            models.Index(fields=["conversation", "created_at"]),
            models.Index(fields=["sender"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        preview = self.content[:40] if self.content else self.type
        return f"{self.sender} • {preview}"


class MessageReaction(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="reactions",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_reactions",
    )

    emoji = models.CharField(max_length=32)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_message_reactions"
        ordering = ["created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["message", "user", "emoji"],
                name="unique_message_reaction",
            )
        ]

        indexes = [
            models.Index(fields=["message"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} • {self.emoji} • {self.message.pk}"


class UserPresence(models.Model):
    class Status(models.TextChoices):
        ONLINE = "online", "Online"
        IDLE = "idle", "Idle"
        DND = "dnd", "Do Not Disturb"
        INVISIBLE = "invisible", "Invisible"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="presence",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ONLINE,
    )

    custom_status = models.CharField(
        max_length=128,
        blank=True,
    )

    custom_status_emoji = models.CharField(
        max_length=32,
        blank=True,
    )

    custom_status_expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    last_seen = models.DateTimeField(
        default=timezone.now,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "users_presence"

    def __str__(self) -> str:
        return f"{self.user.username} Presence"

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from chat.exceptions import (
    EmptyMessage,
    MessagePermissionDenied,
    UserNotConversationParticipant,
)
from chat.models import (
    Conversation,
    ConversationParticipant,
    Message,
    MessageReaction,
)

User = get_user_model()


class MessageService:
    @staticmethod
    def can_send_message(
        conversation: Conversation,
        user: User,
    ) -> bool:
        return ConversationParticipant.objects.filter(
            conversation=conversation,
            user=user,
        ).exists()

    @staticmethod
    @transaction.atomic
    def send_message(
        conversation: Conversation,
        sender: User,
        content: str = "",
        attachment=None,
        message_type: str = Message.MessageType.TEXT,
        reply_to: Message | None = None,
    ) -> Message:
        if not MessageService.can_send_message(conversation, sender):
            raise UserNotConversationParticipant()

        if not content.strip() and attachment is None:
            raise EmptyMessage()

        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            type=message_type,
            content=content,
            attachment=attachment,
            reply_to=reply_to,
        )

        conversation.last_message = message
        conversation.save(
            update_fields=[
                "last_message",
                "updated_at",
            ]
        )

        # A new message brings the conversation back for anyone who hid it.
        ConversationParticipant.objects.filter(
            conversation=conversation,
            hidden_at__isnull=False,
        ).update(hidden_at=None)

        return message

    @staticmethod
    @transaction.atomic
    def edit_message(
        message: Message,
        user: User,
        content: str,
    ) -> Message:
        if message.sender != user:
            raise MessagePermissionDenied()

        message.content = content
        message.edited_at = timezone.now()

        message.save(
            update_fields=[
                "content",
                "edited_at",
            ]
        )

        return message

    @staticmethod
    @transaction.atomic
    def delete_message(
        message: Message,
        user: User,
    ) -> Message:
        if message.sender != user:
            raise MessagePermissionDenied()

        message.content = ""
        message.attachment = None
        message.deleted_at = timezone.now()

        message.save(
            update_fields=[
                "content",
                "attachment",
                "deleted_at",
            ]
        )

        return message

    @staticmethod
    @transaction.atomic
    def toggle_reaction(
        message: Message,
        user: User,
        emoji: str,
    ) -> bool:
        """Add the reaction if absent, remove it if already present.

        The user must be a participant of the message's conversation.
        Returns True when the reaction was added, False when removed.
        """
        if not MessageService.can_send_message(message.conversation, user):
            raise UserNotConversationParticipant()

        emoji = (emoji or "").strip()
        if not emoji:
            raise EmptyMessage()

        existing = MessageReaction.objects.filter(
            message=message,
            user=user,
            emoji=emoji,
        ).first()

        if existing is not None:
            existing.delete()
            return False

        MessageReaction.objects.create(
            message=message,
            user=user,
            emoji=emoji,
        )
        return True

    @staticmethod
    @transaction.atomic
    def mark_as_read(
        conversation: Conversation,
        user: User,
        message: Message,
    ) -> ConversationParticipant:
        membership = ConversationParticipant.objects.get(
            conversation=conversation,
            user=user,
        )

        membership.last_read_message = message

        membership.save(
            update_fields=[
                "last_read_message",
            ]
        )

        return membership

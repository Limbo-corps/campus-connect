from django.db.models import Prefetch

from chat.models import Conversation, ConversationParticipant
from users.models import User


class ConversationSelector:
    """Read-only queries for conversations."""

    @staticmethod
    def get_conversation(conversation_id):
        """Return a conversation with related data."""
        return (
            Conversation.objects.select_related(
                "owner",
                "last_message",
            )
            .prefetch_related(
                Prefetch(
                    "memberships",
                    queryset=ConversationParticipant.objects.select_related(
                        "user",
                    ),
                )
            )
            .get(id=conversation_id)
        )

    @staticmethod
    def get_user_conversations(user):
        """Return all conversations for a user."""
        return (
            Conversation.objects.filter(
                participants=user,
            )
            .select_related(
                "owner",
                "last_message",
            )
            .prefetch_related(
                Prefetch(
                    "memberships",
                    queryset=ConversationParticipant.objects.select_related(
                        "user",
                    ),
                )
            )
            .distinct()
            .order_by("-updated_at")
        )

    @staticmethod
    def get_direct_conversation(user1, user2):
        """Return the direct conversation between two users."""
        return (
            Conversation.objects.filter(
                is_group=False,
                participants=user1,
            )
            .filter(
                participants=user2,
            )
            .distinct()
            .first()
        )

    @staticmethod
    def get_participants(conversation):
        """Return all participants in a conversation."""
        return User.objects.filter(
            conversation_memberships__conversation=conversation,
        )

    @staticmethod
    def get_contacts(user):
        """
        Return all unique users that share a conversation with the user.
        """
        contacts: set[User] = set()

        for conversation in ConversationSelector.get_user_conversations(user):
            contacts.update(
                ConversationSelector.get_participants(conversation),
            )

        contacts.discard(user)

        return list(contacts)

    @staticmethod
    def is_participant(conversation, user):
        """Return whether a user belongs to a conversation."""
        return ConversationParticipant.objects.filter(
            conversation=conversation,
            user=user,
        ).exists()

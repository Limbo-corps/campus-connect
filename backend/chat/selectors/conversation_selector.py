from django.conf.urls.static import static
from django.contrib.auth import get_user_model
from django.db.models import Prefetch

from chat.models import Conversation, ConversationParticipant
from users.models import User


class ConversationSelector:
    @staticmethod
    def get_conversations(conversation_id):
        return (
            Conversation.objects.select_related(
                "owner",
                "last_message",
            )
            .prefetch_related(
                Prefetch(
                    "memberships",
                    queryset=ConversationParticipant.objects.select_related("user"),
                )
            )
            .get(id=conversation_id)
        )

    @staticmethod
    def get_user_conversations(user):
        return (
            Conversation.objects.filter(participants=user)
            .select_related(
                "owner",
                "last_message",
            )
            .prefetch_related(
                Prefetch(
                    "memberships",
                    queryset=ConversationParticipant.objects.select_related("user"),
                )
            )
            .distinct()
            .order_by("-updated_at")
        )

    @staticmethod
    def get_direct_conversation(user1, user2):
        return (
            Conversation.objects.filter(
                is_group=False,
                participants=user1,
            )
            .filter(participants=user2)
            .distinct()
        ).first()

    @staticmethod
    def get_participants(conversation):
        return User.objects.filter(
            conversation_memberships__conversation=conversation,
        )

    @staticmethod
    def is_participant(conversation, user):
        return ConversationParticipant.objects.filter(
            conversation=conversation,
            user=user,
        ).exists()

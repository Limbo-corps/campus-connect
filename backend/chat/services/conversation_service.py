from django.db import transaction

from users.models import User

from chat.exceptions import (
    AlreadyConversationParticipant,
    CannotMessageYourself,
    InvalidConversation,
    NotMutualFollowers,
)
from chat.models import Conversation, ConversationParticipant
from chat.selectors.conversation_selector import ConversationSelector


class ConversationService:
    @staticmethod
    @transaction.atomic
    def create_conversation(
        creator: User,
        participants: list[User],
        name: str | None = None,
    ) -> Conversation:
        """
        Create a conversation.

        • If exactly one participant is supplied, return the existing
          direct conversation if one already exists.

        • Otherwise create a new group conversation.
        """

        unique_participants: list[User] = []

        for participant in participants:
            if participant == creator:
                continue

            if participant not in unique_participants:
                unique_participants.append(participant)

        if len(unique_participants) == 0:
            raise CannotMessageYourself()

        # You may only open a conversation with people who follow you back.
        if any(not creator.is_mutual_with(p) for p in unique_participants):
            raise NotMutualFollowers()

        if len(unique_participants) == 1:
            return ConversationService.create_direct_conversation(
                creator=creator,
                other_user=unique_participants[0],
            )

        return ConversationService.create_group_conversation(
            creator=creator,
            participants=unique_participants,
            name=name,
        )

    @staticmethod
    @transaction.atomic
    def create_direct_conversation(
        creator: User,
        other_user: User,
    ) -> Conversation:
        if creator == other_user:
            raise CannotMessageYourself()

        if not creator.is_mutual_with(other_user):
            raise NotMutualFollowers()

        existing = ConversationSelector.get_direct_conversation(
            creator,
            other_user,
        )

        if existing:
            return existing

        conversation = Conversation.objects.create(
            owner=creator,
            is_group=False,
        )

        ConversationParticipant.objects.bulk_create(
            [
                ConversationParticipant(
                    conversation=conversation,
                    user=creator,
                    is_admin=True,
                ),
                ConversationParticipant(
                    conversation=conversation,
                    user=other_user,
                ),
            ]
        )

        return conversation

    @staticmethod
    @transaction.atomic
    def create_group_conversation(
        creator: User,
        participants: list[User],
        name: str | None,
    ) -> Conversation:
        conversation = Conversation.objects.create(
            owner=creator,
            is_group=True,
            name=name or "",
        )

        memberships = [
            ConversationParticipant(
                conversation=conversation,
                user=creator,
                is_admin=True,
            )
        ]

        memberships.extend(
            ConversationParticipant(
                conversation=conversation,
                user=user,
            )
            for user in participants
        )

        ConversationParticipant.objects.bulk_create(
            memberships,
        )

        return conversation

    @staticmethod
    @transaction.atomic
    def add_participant(
        conversation: Conversation,
        user: User,
    ) -> ConversationParticipant:
        if ConversationSelector.is_participant(conversation, user):
            raise AlreadyConversationParticipant()

        return ConversationParticipant.objects.create(
            conversation=conversation,
            user=user,
        )

    @staticmethod
    @transaction.atomic
    def remove_participant(
        conversation: Conversation,
        user: User,
    ) -> None:
        membership = ConversationParticipant.objects.filter(
            conversation=conversation,
            user=user,
        ).first()

        if membership is None:
            raise InvalidConversation()

        membership.delete()

    @staticmethod
    @transaction.atomic
    def leave_conversation(
        conversation: Conversation,
        user: User,
    ) -> None:
        ConversationService.remove_participant(
            conversation,
            user,
        )

    @staticmethod
    @transaction.atomic
    def rename_group(
        conversation: Conversation,
        name: str,
    ) -> Conversation:
        if not conversation.is_group:
            raise InvalidConversation()

        conversation.name = name
        conversation.save(update_fields=["name"])

        return conversation

    @staticmethod
    @transaction.atomic
    def update_group_image(
        conversation: Conversation,
        image,
    ) -> Conversation:
        if not conversation.is_group:
            raise InvalidConversation()

        conversation.image = image
        conversation.save(update_fields=["image"])

        return conversation

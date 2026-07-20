from __future__ import annotations

from typing import Any, cast

# If using Django Channels, replace sync_to_async with:
# from channels.db import database_sync_to_async as sync_to_async
from asgiref.sync import sync_to_async

from chat.models import (
    Conversation,
    ConversationParticipant,
    Message,
    MessageReaction,
)
from chat.realtime.broadcaster import Broadcaster
from chat.realtime.events import ChatEvents
from chat.serializers import ConversationSerializer, MessageSerializer
from users.models import User


class ChatDispatcher:
    """Dispatches chat events to connected clients safely across async boundaries."""

    @staticmethod
    async def _get_participants(conversation: Conversation) -> list[User]:
        def _load_participants() -> list[User]:
            return list(conversation.participants.all())

        return await sync_to_async(_load_participants, thread_sensitive=True)()

    # ------------------------------------------------------------------
    # Conversation Events
    # ------------------------------------------------------------------

    @staticmethod
    async def conversation_created(conversation: Conversation) -> None:
        """Broadcast a new conversation."""

        # Wrap ORM relationships and serialization into an isolated sync function
        def _get_payload_and_participants():
            return (
                cast(dict[str, Any], ConversationSerializer(conversation).data),
                list(conversation.participants.all()),
            )

        payload, participants = await sync_to_async(
            _get_payload_and_participants, thread_sensitive=True
        )()

        await Broadcaster.send_to_users(
            users=participants,
            event=ChatEvents.CONVERSATION_CREATED,
            data=payload,
        )

    @staticmethod
    async def conversation_updated(conversation: Conversation) -> None:
        """Broadcast updated conversation details."""

        def _serialize():
            return cast(dict[str, Any], ConversationSerializer(conversation).data)

        payload = await sync_to_async(_serialize, thread_sensitive=True)()
        participants = await ChatDispatcher._get_participants(conversation)

        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.CONVERSATION_UPDATED,
            data=payload,
        )
        await Broadcaster.send_to_users(
            users=participants,
            event=ChatEvents.CONVERSATION_UPDATED,
            data=payload,
        )

    @staticmethod
    async def conversation_deleted(conversation: Conversation) -> None:
        """Broadcast a deleted conversation."""
        participants = await ChatDispatcher._get_participants(conversation)
        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.CONVERSATION_DELETED,
            data={
                "conversation_id": str(conversation.id),
            },
        )
        await Broadcaster.send_to_users(
            users=participants,
            event=ChatEvents.CONVERSATION_DELETED,
            data={
                "conversation_id": str(conversation.id),
            },
        )

    # ------------------------------------------------------------------
    # Message Events
    # ------------------------------------------------------------------

    @staticmethod
    async def message_created(message: Message) -> None:
        """Broadcast a new message."""

        def _serialize_and_get_conversation():
            return (
                cast(dict[str, Any], MessageSerializer(message).data),
                message.conversation,
            )

        payload, conversation = await sync_to_async(
            _serialize_and_get_conversation, thread_sensitive=True
        )()
        participants = await ChatDispatcher._get_participants(conversation)

        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.MESSAGE_CREATED,
            data=payload,
        )
        await Broadcaster.send_to_users(
            users=participants,
            event=ChatEvents.MESSAGE_CREATED,
            data=payload,
        )

    @staticmethod
    async def message_updated(message: Message) -> None:
        """Broadcast an updated message."""

        def _serialize_and_get_conversation():
            return (
                cast(dict[str, Any], MessageSerializer(message).data),
                message.conversation,
            )

        payload, conversation = await sync_to_async(
            _serialize_and_get_conversation, thread_sensitive=True
        )()
        participants = await ChatDispatcher._get_participants(conversation)

        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.MESSAGE_UPDATED,
            data=payload,
        )
        await Broadcaster.send_to_users(
            users=participants,
            event=ChatEvents.MESSAGE_UPDATED,
            data=payload,
        )

    @staticmethod
    async def message_deleted(message: Message) -> None:
        """Broadcast a deleted message."""

        def _serialize_and_get_conversation():
            return (
                cast(dict[str, Any], MessageSerializer(message).data),
                message.conversation,
            )

        payload, conversation = await sync_to_async(
            _serialize_and_get_conversation, thread_sensitive=True
        )()
        participants = await ChatDispatcher._get_participants(conversation)

        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.MESSAGE_DELETED,
            data=payload,
        )
        await Broadcaster.send_to_users(
            users=participants,
            event=ChatEvents.MESSAGE_DELETED,
            data=payload,
        )

    # ------------------------------------------------------------------
    # Participant Events
    # ------------------------------------------------------------------

    @staticmethod
    async def participant_joined(
        participant: ConversationParticipant,
    ) -> None:
        """Broadcast a participant joining."""

        def _get_relations():
            return participant.conversation, participant.user

        conversation, user = await sync_to_async(
            _get_relations, thread_sensitive=True
        )()

        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.PARTICIPANT_JOINED,
            data={
                "conversation_id": str(conversation.id),
                "user_id": str(user.id),
            },
        )

    @staticmethod
    async def participant_left(
        participant: ConversationParticipant,
    ) -> None:
        """Broadcast a participant leaving."""

        def _get_relations():
            return participant.conversation, participant.user

        conversation, user = await sync_to_async(
            _get_relations, thread_sensitive=True
        )()

        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.PARTICIPANT_LEFT,
            data={
                "conversation_id": str(conversation.id),
                "user_id": str(user.id),
            },
        )

    # ------------------------------------------------------------------
    # Reaction Events
    # ------------------------------------------------------------------

    @staticmethod
    async def reaction_updated(
        reaction: MessageReaction,
    ) -> None:
        """Broadcast updated reactions."""

        def _get_relations():
            return reaction.message, reaction.message.conversation

        message, conversation = await sync_to_async(
            _get_relations, thread_sensitive=True
        )()
        participants = await ChatDispatcher._get_participants(conversation)

        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.REACTION_UPDATED,
            data={
                "conversation_id": str(conversation.id),
                "message_id": str(message.id),
            },
        )
        await Broadcaster.send_to_users(
            users=participants,
            event=ChatEvents.REACTION_UPDATED,
            data={
                "conversation_id": str(conversation.id),
                "message_id": str(message.id),
            },
        )

    # ------------------------------------------------------------------
    # Typing Events
    # ------------------------------------------------------------------

    @staticmethod
    async def typing_started(
        conversation: Conversation,
        user: User,
    ) -> None:
        """Broadcast that a user started typing."""

        print("=" * 80)
        print("[Dispatcher] typing_started")
        print("[Dispatcher] conversation:", conversation.id)
        print("[Dispatcher] user:", user.id, user.username)
        print("[Dispatcher] Calling Broadcaster.send_to_conversation()")

        participants = await ChatDispatcher._get_participants(conversation)
        typing_data = {
            "conversation_id": str(conversation.id),
            "user_id": str(user.id),
            "username": user.username,
            "is_typing": True,
        }

        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.TYPING_STARTED,
            data=typing_data,
        )
        await Broadcaster.send_to_users(
            users=participants,
            event=ChatEvents.TYPING_STARTED,
            data=typing_data,
        )

        print("[Dispatcher] Broadcaster.send_to_conversation() returned")
        print("=" * 80)

    @staticmethod
    async def typing_stopped(
        conversation: Conversation,
        user: User,
    ) -> None:
        """Broadcast that a user stopped typing."""

        print("=" * 80)
        print("[Dispatcher] typing_stopped")
        print("[Dispatcher] conversation:", conversation.id)
        print("[Dispatcher] user:", user.id, user.username)
        print("[Dispatcher] Calling Broadcaster.send_to_conversation()")

        participants = await ChatDispatcher._get_participants(conversation)
        typing_data = {
            "conversation_id": str(conversation.id),
            "user_id": str(user.id),
            "username": user.username,
            "is_typing": False,
        }

        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.TYPING_STOPPED,
            data=typing_data,
        )
        await Broadcaster.send_to_users(
            users=participants,
            event=ChatEvents.TYPING_STOPPED,
            data=typing_data,
        )

        print("[Dispatcher] Broadcaster.send_to_conversation() returned")
        print("=" * 80)

    # ------------------------------------------------------------------
    # Presence Events
    # ------------------------------------------------------------------

    @staticmethod
    async def presence_updated(
        *, users: list[User], user: User, presence: dict
    ) -> None:
        """Broadcast an updated presence state."""
        await Broadcaster.send_to_users(
            users=users,
            event=ChatEvents.PRESENCE_UPDATED,
            data={"user_id": str(user.id), **presence},
        )

    @staticmethod
    async def presence_snapshot(
        *,
        user: User,
        presences: list[dict],
    ) -> None:
        """Send the current online users to a user."""
        await Broadcaster.send_to_user(
            user=user,
            event=ChatEvents.PRESENCE_SNAPSHOT,
            data={
                "presences": presences,
            },
        )

    # ------------------------------------------------------------------
    # Read Receipt Events
    # ------------------------------------------------------------------

    @staticmethod
    async def read_receipt_updated(
        conversation: Conversation,
        user: User,
        last_read_message_id: str,
        last_read_at_iso: str,
    ) -> None:
        """Broadcast that a user has updated their read receipt up to a specific message."""

        def _get_conversation_participants() -> list[User]:
            return list(conversation.participants.all())

        participants = await sync_to_async(
            _get_conversation_participants, thread_sensitive=True
        )()

        payload = {
            "conversation_id": str(conversation.id),
            "user_id": str(user.id),
            "last_read_message": last_read_message_id,
            "last_read_at": last_read_at_iso,
        }

        # Dispatch down the channel layer to all subscribers listening to this chat room
        await Broadcaster.send_to_conversation(
            conversation=conversation,
            event=ChatEvents.READ_RECEIPT_UPDATED,
            data=payload,
        )

        # Notify individual participant message groups to ensure out-of-focus updates sync perfectly
        await Broadcaster.send_to_users(
            users=participants,
            event=ChatEvents.READ_RECEIPT_UPDATED,
            data=payload,
        )

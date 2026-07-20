from __future__ import annotations

from typing import Any

from channels.db import database_sync_to_async

from chat.realtime.dispatcher import ChatDispatcher
from chat.selectors.conversation_selector import ConversationSelector
from users.models import User


class TypingService:
    """Handles typing indicators."""

    @classmethod
    async def handle(
        cls,
        *,
        user: User,
        payload: dict[str, Any],
    ) -> None:
        print("=" * 80)
        print("[TypingService] Received payload:", payload)

        conversation_id = payload.get("conversation")
        is_typing = bool(payload.get("is_typing"))

        print(
            "[TypingService] conversation_id:",
            conversation_id,
            "| is_typing:",
            is_typing,
        )

        if conversation_id is None:
            print("[TypingService] No conversation id. Ignoring.")
            return

        print("[TypingService] Fetching conversation...")

        conversation = await database_sync_to_async(
            ConversationSelector.get_conversation,
        )(conversation_id)

        print("[TypingService] Conversation found:", conversation.id)

        print("[TypingService] Checking participant...")

        is_participant = await database_sync_to_async(
            ConversationSelector.is_participant,
        )(
            conversation,
            user,
        )

        print("[TypingService] is_participant =", is_participant)

        if not is_participant:
            print("[TypingService] User is not a participant. Ignoring.")
            return

        if is_typing:
            print("[TypingService] Dispatching typing.started")
            await ChatDispatcher.typing_started(
                conversation=conversation,
                user=user,
            )
        else:
            print("[TypingService] Dispatching typing.stopped")
            await ChatDispatcher.typing_stopped(
                conversation=conversation,
                user=user,
            )

        print("[TypingService] Done")
        print("=" * 80)

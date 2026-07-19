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
        conversation_id = payload.get("conversation")
        is_typing = bool(payload.get("is_typing"))

        if conversation_id is None:
            return

        conversation = await database_sync_to_async(
            ConversationSelector.get_conversation,
        )(conversation_id)

        is_participant = await database_sync_to_async(
            ConversationSelector.is_participant,
        )(
            conversation,
            user,
        )

        if not is_participant:
            return

        if is_typing:
            await ChatDispatcher.typing_started(
                conversation=conversation,
                user=user,
            )
        else:
            await ChatDispatcher.typing_stopped(
                conversation=conversation,
                user=user,
            )

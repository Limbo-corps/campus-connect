from __future__ import annotations

import logging
from collections.abc import Iterable
from typing import Any

from channels.layers import get_channel_layer

from chat.models import Conversation
from users.models import User

logger = logging.getLogger(__name__)


def user_group(user: User) -> str:
    """Return the websocket group for a user."""
    return f"user_{user.id}"


def conversation_group(conversation: Conversation) -> str:
    """Return the websocket group for a conversation."""
    return f"conversation_{conversation.id}"


class Broadcaster:
    """Centralizes websocket broadcasting."""

    @staticmethod
    async def send_to_group(
        group: str,
        event: str,
        data: dict[str, Any],
    ) -> None:
        """Send an event to a Channels group."""

        def _normalize(obj: Any) -> Any:
            """Recursively convert non-serializable types (UUID, date/time) to strings."""
            from uuid import UUID
            import datetime

            if isinstance(obj, UUID):
                return str(obj)
            if isinstance(obj, (datetime.datetime, datetime.date)):
                return obj.isoformat()
            if isinstance(obj, dict):
                return {k: _normalize(v) for k, v in obj.items()}
            if isinstance(obj, (list, tuple, set)):
                return [_normalize(v) for v in obj]
            return obj

        channel_layer = get_channel_layer()

        if channel_layer is None:
            logger.warning("Channel layer unavailable.")
            return

        try:
            await channel_layer.group_send(
                group,
                {
                    "type": "chat.event",
                    "message": {
                        "event": event,
                        "data": _normalize(data),
                    },
                },
            )
        except Exception:
            logger.exception(
                "Failed to broadcast websocket event '%s'.",
                event,
            )

    @classmethod
    async def send_to_user(
        cls,
        user: User,
        event: str,
        data: dict[str, Any],
    ) -> None:
        """Broadcast an event to a user's active connections."""
        await cls.send_to_group(
            user_group(user),
            event,
            data,
        )

    @classmethod
    async def send_to_users(
        cls,
        users: Iterable[User],
        event: str,
        data: dict[str, Any],
    ) -> None:
        """Broadcast the same event to multiple users."""
        for user in users:
            await cls.send_to_user(
                user,
                event,
                data,
            )

    @classmethod
    async def send_to_conversation(
        cls,
        conversation: Conversation,
        event: str,
        data: dict[str, Any],
    ) -> None:
        """Broadcast an event to a conversation."""
        await cls.send_to_group(
            conversation_group(conversation),
            event,
            data,
        )

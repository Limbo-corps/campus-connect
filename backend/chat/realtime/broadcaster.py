from __future__ import annotations

import logging
from collections.abc import Iterable
from datetime import date, datetime
from typing import Any
from uuid import UUID

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
    def _normalize(obj: Any) -> Any:
        """Convert non-JSON-serializable values into JSON-safe types."""
        if isinstance(obj, UUID):
            return str(obj)

        if isinstance(obj, (datetime, date)):
            return obj.isoformat()

        if isinstance(obj, dict):
            return {key: Broadcaster._normalize(value) for key, value in obj.items()}

        if isinstance(obj, (list, tuple, set)):
            return [Broadcaster._normalize(value) for value in obj]

        return obj

    @classmethod
    async def send_to_group(
        cls,
        group: str,
        event: str,
        data: dict[str, Any],
    ) -> None:
        """Send an event to a Channels group."""
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
                        "data": cls._normalize(data),
                    },
                },
            )

        except Exception:
            logger.exception(
                "Failed to broadcast websocket event '%s' to group '%s'.",
                event,
                group,
            )

    @classmethod
    async def send_to_user(
        cls,
        user: User,
        event: str,
        data: dict[str, Any],
    ) -> None:
        """Send an event to a single user."""
        await cls.send_to_group(
            group=user_group(user),
            event=event,
            data=data,
        )

    @classmethod
    async def send_to_users(
        cls,
        users: Iterable[User],
        event: str,
        data: dict[str, Any],
    ) -> None:
        """Send an event to multiple users."""
        for user in users:
            await cls.send_to_user(
                user=user,
                event=event,
                data=data,
            )

    @classmethod
    async def send_to_conversation(
        cls,
        conversation: Conversation,
        event: str,
        data: dict[str, Any],
    ) -> None:
        """Send an event to all members of a conversation."""
        await cls.send_to_group(
            group=conversation_group(conversation),
            event=event,
            data=data,
        )

"""
WebSocket consumer for the chat application.
"""

from __future__ import annotations

import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.serializers.json import DjangoJSONEncoder

from chat.realtime.connections import ConnectionManager
from chat.services.ping_service import PingService
from chat.services.presence_service import PresenceService
from chat.services.typing_service import TypingService
from users.models import User

logger = logging.getLogger(__name__)

Handler = Callable[..., Awaitable[None]]


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Handles authenticated websocket connections."""

    handlers: dict[str, Handler] = {
        "typing": TypingService.handle,
        "ping": PingService.handle,
    }

    user: User

    async def connect(self) -> None:
        """Accept an authenticated websocket connection."""
        user = self.scope.get("user")

        if not isinstance(user, User) or user.is_anonymous:
            await self.close(code=4001)
            return

        self.user = user

        await ConnectionManager.connect_user(
            user=self.user,
            channel_name=self.channel_name,
        )

        await self.accept()

        await PresenceService.connected(
            user=self.user,
        )

        logger.debug(
            "WebSocket connected for user '%s'.",
            self.user.id,
        )

    async def disconnect(
        self,
        code: int,
    ) -> None:
        """Handle websocket disconnection."""
        del code

        if not hasattr(self, "user"):
            return

        await PresenceService.disconnected(
            user=self.user,
        )

        await ConnectionManager.disconnect_user(
            user=self.user,
            channel_name=self.channel_name,
        )

        logger.debug(
            "WebSocket disconnected for user '%s'.",
            self.user.id,
        )

    async def receive_json(
        self,
        content: dict[str, Any],
        **kwargs: Any,
    ) -> None:
        """Dispatch incoming websocket actions."""
        del kwargs

        action = content.get("action")

        if not isinstance(action, str):
            return

        handler = self.handlers.get(action)

        if handler is None:
            logger.warning(
                "Unknown websocket action '%s'.",
                action,
            )
            return

        try:
            await handler(
                user=self.user,
                payload=content,
            )

        except Exception:
            logger.exception(
                "Failed to handle websocket action '%s'.",
                action,
            )

    async def chat_event(
        self,
        event: dict[str, Any],
    ) -> None:
        """Forward an event from the channel layer to the websocket."""
        await self.send_json(
            event["message"],
        )

    @classmethod
    async def encode_json(
        cls,
        content: Any,
    ) -> str:
        """Serialize websocket payloads using Django's JSON encoder."""
        return json.dumps(
            content,
            cls=DjangoJSONEncoder,
        )

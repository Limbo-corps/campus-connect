"""
WebSocket consumer for the chat application.
"""

from __future__ import annotations

import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any, cast

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.serializers.json import DjangoJSONEncoder

from chat.realtime.connections import ConnectionManager
from chat.services.presence_service import PresenceService
from chat.services.typing_service import TypingService
from chat.services.ping_service import PingService
from users.models import User

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Handles authenticated websocket connections."""

    handlers: dict[
        str,
        Callable[..., Awaitable[None]],
    ] = {
        "typing": TypingService.handle,
        # Lightweight client pings — handled as a no-op to avoid noisy logs.
        "ping": PingService.handle,
    }

    user: User

    async def connect(self) -> None:
        """Authenticate and register the websocket connection."""
        user = self.scope.get("user")

        if user is None or user.is_anonymous:
            await self.close(code=4001)
            return

        self.user = cast(User, user)

        await ConnectionManager.connect_user(
            user=self.user,
            channel_name=self.channel_name,
        )

        await self.accept()

        await PresenceService.connected(
            user=self.user,
        )

    async def disconnect(self, code: int) -> None:
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

        await handler(
            user=self.user,
            payload=content,
        )

    async def chat_event(
        self,
        event: dict[str, Any],
    ) -> None:
        """Forward server events to the client."""
        await self.send_json(
            event["message"],
        )

    @classmethod
    async def encode_json(
        cls,
        content: Any,
    ) -> str:
        """Serialize websocket payloads."""
        return json.dumps(
            content,
            cls=DjangoJSONEncoder,
        )

from __future__ import annotations

from typing import Any

from users.models import User


class PingService:
    """Handles lightweight ping actions from the websocket client.

    This is intentionally a no-op to avoid noisy 'Unknown websocket action
    "ping"' log messages. Keep it minimal — if future features need a
    heartbeat or timestamp refresh, implement them here.
    """

    @classmethod
    async def handle(
        cls,
        *,
        user: User,
        payload: dict[str, Any],
    ) -> None:
        # Intentionally do nothing; this keeps the connection alive without
        # producing noisy logs. Could later update presence TTL if desired.
        return

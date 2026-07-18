import asyncio
import logging
from channels.layers import get_channel_layer

from users.models import User

logger = logging.getLogger(__name__)

class ConnectionManager:
    @staticmethod
    async def _safe_group_op(op, group: str, channel_name: str) -> None:
        """Perform a channel layer group operation with retries on failure.

        Keeps transient Redis/connection errors from bubbling up and closing
        the websocket. Retries a few times with exponential backoff.
        """
        channel_layer = get_channel_layer()

        if channel_layer is None:
            return

        # retry a few times on transient errors
        for attempt in range(3):
            try:
                await op(group, channel_name)
                return
            except Exception as exc:  # narrow-catch is fine here; we don't want exceptions to close WS
                logger.warning(
                    "Channel layer operation %s failed for %s (attempt %d): %s",
                    getattr(op, "__name__", str(op)),
                    group,
                    attempt + 1,
                    exc,
                )
                # small exponential backoff
                await asyncio.sleep(0.2 * (2 ** attempt))

        logger.error("Channel layer operation %s failed for %s after retries", getattr(op, "__name__", str(op)), group)

    @staticmethod
    async def connect_user(user: User, channel_name: str) -> None:
        await ConnectionManager._safe_group_op(
            get_channel_layer().group_add,
            f"user_{user.id}",
            channel_name,
        )

    @staticmethod
    async def disconnect_user(user: User, channel_name: str) -> None:
        await ConnectionManager._safe_group_op(
            get_channel_layer().group_discard,
            f"user_{user.id}",
            channel_name,
        )

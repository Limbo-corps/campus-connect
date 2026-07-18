"""
Helpers for pushing real-time events to connected clients over Channels.

Each user has a personal group ``user_<uuid>``. Every device/tab the user has
open joins that group, so broadcasting to it reaches all of their sessions.
Events are dispatched to the union of participant groups for a conversation.
"""

import json
import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.serializers.json import DjangoJSONEncoder

logger = logging.getLogger(__name__)


def user_group(user_id) -> str:
    return f"user_{user_id}"


def _json_safe(payload):
    """Convert UUID/datetime/Decimal etc. into JSON primitives so the payload
    survives the channel-layer transport (msgpack over Redis) and the
    consumer's ``json.dumps`` encode step."""
    return json.loads(json.dumps(payload, cls=DjangoJSONEncoder))


def send_to_users(user_ids, event_type: str, payload: dict) -> None:
    """
    Push ``{"type": event_type, ...payload}`` to each user's personal group.

    ``event_type`` is the client-facing event name (e.g. ``message.new``).
    """
    layer = get_channel_layer()
    if layer is None:
        return

    message = {"event": event_type, "data": _json_safe(payload)}

    for user_id in set(user_ids):
        try:
            async_to_sync(layer.group_send)(
                user_group(user_id),
                {"type": "chat.event", "message": message},
            )
        except Exception as exc:
            logger.warning("Failed to publish realtime event to %s: %s", user_id, exc)


def broadcast_to_conversation(conversation, event_type: str, payload: dict) -> None:
    """Send an event to every current participant of a conversation."""
    user_ids = list(
        conversation.memberships.values_list("user_id", flat=True)
    )
    send_to_users(user_ids, event_type, payload)


def broadcast_presence(user_id, is_online: bool, contact_ids) -> None:
    """Tell the given contacts that ``user_id`` went online/offline."""
    send_to_users(
        contact_ids,
        "presence.update",
        {"user_id": str(user_id), "is_online": is_online},
    )

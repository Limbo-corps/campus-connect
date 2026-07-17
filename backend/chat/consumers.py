"""
WebSocket consumer for the chat system.

Each connection is authenticated (see ``chat.middleware.JWTAuthMiddleware``) and
joins the user's personal group ``user_<id>``. Server-originated events
(new/edited/deleted messages, participant changes, read receipts) are pushed by
the REST layer via ``chat.realtime``; the consumer itself handles client->server
signals that don't need persistence: typing indicators and presence.
"""

import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.cache import cache
from django.core.serializers.json import DjangoJSONEncoder

from chat.realtime import user_group

PRESENCE_KEY = "chat:online:{user_id}"
PRESENCE_TTL = 60 * 60  # seconds; refreshed on every (dis)connect


@database_sync_to_async
def _register_connection(user_id) -> bool:
    """Increment the user's live-connection count. Returns True if they just
    transitioned from offline -> online."""
    key = PRESENCE_KEY.format(user_id=user_id)
    count = cache.get(key, 0) + 1
    cache.set(key, count, PRESENCE_TTL)
    return count == 1


@database_sync_to_async
def _unregister_connection(user_id) -> bool:
    """Decrement the count. Returns True if the user is now fully offline."""
    key = PRESENCE_KEY.format(user_id=user_id)
    count = max(0, cache.get(key, 0) - 1)
    if count:
        cache.set(key, count, PRESENCE_TTL)
    else:
        cache.delete(key)
    return count == 0


@database_sync_to_async
def _contact_ids(user_id):
    """Every user who shares at least one conversation with this user."""
    from chat.models import ConversationParticipant

    conversation_ids = ConversationParticipant.objects.filter(
        user_id=user_id
    ).values_list("conversation_id", flat=True)

    return list(
        ConversationParticipant.objects.filter(
            conversation_id__in=conversation_ids
        )
        .exclude(user_id=user_id)
        .values_list("user_id", flat=True)
        .distinct()
    )


@database_sync_to_async
def _online_among(user_ids):
    return [
        str(uid)
        for uid in user_ids
        if cache.get(PRESENCE_KEY.format(user_id=uid), 0) > 0
    ]


@database_sync_to_async
def _is_participant(user_id, conversation_id) -> bool:
    from chat.models import ConversationParticipant

    return ConversationParticipant.objects.filter(
        user_id=user_id, conversation_id=conversation_id
    ).exists()


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if user is None or user.is_anonymous:
            await self.close(code=4001)
            return

        self.user = user
        self.group_name = user_group(user.id)

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        became_online = await _register_connection(user.id)
        contacts = await _contact_ids(user.id)

        # Tell this client which of their contacts are currently online.
        online = await _online_among(contacts)
        await self.send_json({"event": "presence.snapshot", "data": {"online": online}})

        # Announce our arrival to contacts (only on the first connection).
        if became_online:
            await self._broadcast_presence(contacts, is_online=True)

    async def disconnect(self, code):
        if not hasattr(self, "user"):
            return

        await self.channel_layer.group_discard(self.group_name, self.channel_name)

        now_offline = await _unregister_connection(self.user.id)
        if now_offline:
            contacts = await _contact_ids(self.user.id)
            await self._broadcast_presence(contacts, is_online=False)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")

        if action == "typing":
            await self._handle_typing(content)
        elif action == "ping":
            await self.send_json({"event": "pong", "data": {}})

    async def _handle_typing(self, content):
        conversation_id = content.get("conversation")
        is_typing = bool(content.get("is_typing"))
        if not conversation_id:
            return

        if not await _is_participant(self.user.id, conversation_id):
            return

        contacts = await self._conversation_others(conversation_id)
        payload = {
            "conversation": str(conversation_id),
            "user_id": str(self.user.id),
            "username": self.user.username,
            "is_typing": is_typing,
        }
        for uid in contacts:
            await self.channel_layer.group_send(
                user_group(uid),
                {
                    "type": "chat.event",
                    "message": {"event": "typing", "data": payload},
                },
            )

    @database_sync_to_async
    def _conversation_others(self, conversation_id):
        from chat.models import ConversationParticipant

        return list(
            ConversationParticipant.objects.filter(conversation_id=conversation_id)
            .exclude(user_id=self.user.id)
            .values_list("user_id", flat=True)
        )

    async def _broadcast_presence(self, contact_ids, *, is_online):
        payload = {"user_id": str(self.user.id), "is_online": is_online}
        for uid in contact_ids:
            await self.channel_layer.group_send(
                user_group(uid),
                {
                    "type": "chat.event",
                    "message": {"event": "presence.update", "data": payload},
                },
            )

    # Handler for events pushed via chat.realtime.send_to_users
    async def chat_event(self, event):
        await self.send_json(event["message"])

    @classmethod
    async def encode_json(cls, content):
        # UUID / datetime-aware encoding as a safety net.
        return json.dumps(content, cls=DjangoJSONEncoder)

from __future__ import annotations

import logging

from channels.db import database_sync_to_async
from django.core.cache import cache

from chat.models import UserPresence
from chat.realtime.dispatcher import ChatDispatcher
from chat.selectors.conversation_selector import ConversationSelector
from users.models import User

from django.utils import timezone

logger = logging.getLogger(__name__)

PRESENCE_KEY = "chat:online:{user_id}"
PRESENCE_TTL = 60 * 60


class PresenceService:
    """Manages user presence in the chat system."""

    @staticmethod
    def _key(user: User) -> str:
        return PRESENCE_KEY.format(user_id=user.id)

    @staticmethod
    def _update_last_seen(user: User) -> None:
        UserPresence.objects.filter(user=user).update(
            last_seen=timezone.now(),
        )

    @classmethod
    def get_effective_presence(
        cls,
        user: User,
    ) -> dict:
        """
        Return the effective presence for the user.
        """
        presence, _ = UserPresence.objects.get_or_create(
            user=user,
        )

        return {
            "is_online": cls.is_online(user),
            "status": presence.status,
            "custom_status": presence.custom_status,
            "custom_status_emoji": presence.custom_status_emoji,
            "custom_status_expires_at": presence.custom_status_expires_at,
            "last_seen": presence.last_seen,
        }

    @classmethod
    async def connected(
        cls,
        *,
        user: User,
    ) -> None:
        became_online = await database_sync_to_async(
            cls.connect,
        )(user)

        contacts = await database_sync_to_async(
            ConversationSelector.get_contacts,
        )(user)

        presences = await database_sync_to_async(
            cls.get_presences,
        )(contacts + [user])

        presence = await database_sync_to_async(
            cls.get_effective_presence,
        )(user)

        await ChatDispatcher.presence_snapshot(
            user=user,
            presences=presences,
        )

        if became_online:
            await ChatDispatcher.presence_updated(
                users=contacts,
                user=user,
                presence=presence,
            )

    @classmethod
    async def disconnected(
        cls,
        *,
        user: User,
    ) -> None:
        went_offline = await database_sync_to_async(
            cls.disconnect,
        )(user)

        if not went_offline:
            return

        await database_sync_to_async(
            cls._update_last_seen,
        )(user)

        contacts = await database_sync_to_async(
            ConversationSelector.get_contacts,
        )(user)

        presence = await database_sync_to_async(
            cls.get_effective_presence,
        )(user)

        await ChatDispatcher.presence_updated(
            users=contacts,
            user=user,
            presence=presence,
        )

    @classmethod
    def connect(
        cls,
        user: User,
    ) -> bool:
        """
        Register a connection.

        Returns True if the user transitioned from offline to online.
        """
        try:
            key = cls._key(user)
            count = cache.get(key, 0) + 1

            cache.set(
                key,
                count,
                PRESENCE_TTL,
            )

            return count == 1

        except Exception:
            logger.exception(
                "Failed to register presence for user '%s'.",
                user.id,
            )
            return False

    @classmethod
    def disconnect(
        cls,
        user: User,
    ) -> bool:
        """
        Unregister a connection.

        Returns True if the user transitioned from online to offline.
        """
        try:
            key = cls._key(user)
            count = max(
                0,
                cache.get(key, 0) - 1,
            )

            if count:
                cache.set(
                    key,
                    count,
                    PRESENCE_TTL,
                )
            else:
                cache.delete(key)

            return count == 0

        except Exception:
            logger.exception(
                "Failed to unregister presence for user '%s'.",
                user.id,
            )
            return False

    @classmethod
    def is_online(
        cls,
        user: User,
    ) -> bool:
        """Return whether the user is currently online."""
        try:
            return (
                cache.get(
                    cls._key(user),
                    0,
                )
                > 0
            )

        except Exception:
            logger.exception(
                "Failed to check presence for user '%s'.",
                user.id,
            )
            return False

    @classmethod
    def get_presences(
        cls,
        users: list[User],
    ) -> list[dict]:
        """Return the effective presence for each user."""
        return [
            {
                "user_id": str(user.id),
                **cls.get_effective_presence(user),
            }
            for user in users
        ]

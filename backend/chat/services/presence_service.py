from __future__ import annotations

import logging

from channels.db import database_sync_to_async
from django.core.cache import cache

from chat.realtime.dispatcher import ChatDispatcher
from chat.selectors.conversation_selector import ConversationSelector
from users.models import User

logger = logging.getLogger(__name__)

PRESENCE_KEY = "chat:online:{user_id}"
PRESENCE_TTL = 60 * 60


class PresenceService:
    """Manages user presence in the chat system."""

    @staticmethod
    def _key(user: User) -> str:
        return PRESENCE_KEY.format(user_id=user.id)

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

        online_users = await database_sync_to_async(
            cls.get_online_users,
        )(contacts)

        await ChatDispatcher.presence_snapshot(
            user=user,
            online_users=online_users,
        )

        if became_online:
            await ChatDispatcher.presence_updated(
                users=contacts,
                user=user,
                is_online=True,
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

        contacts = await database_sync_to_async(
            ConversationSelector.get_contacts,
        )(user)

        await ChatDispatcher.presence_updated(
            users=contacts,
            user=user,
            is_online=False,
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
            return cache.get(
                cls._key(user),
                0,
            ) > 0

        except Exception:
            logger.exception(
                "Failed to check presence for user '%s'.",
                user.id,
            )
            return False

    @classmethod
    def get_online_users(
        cls,
        users,
    ) -> list[User]:
        """Return the users that are currently online."""
        return [
            user
            for user in users
            if cls.is_online(user)
        ]

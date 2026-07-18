"""
JWT authentication middleware for Channels (WebSocket) connections.

Browsers cannot set custom headers on a WebSocket handshake, so the access
token is passed as a ``?token=<jwt>`` query-string parameter. This middleware
validates it and populates ``scope["user"]`` (or ``AnonymousUser`` on failure).
"""

from typing import Any, cast
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token: str):
    from rest_framework_simplejwt.exceptions import TokenError
    from rest_framework_simplejwt.tokens import AccessToken

    try:
        access_token = AccessToken(token)  # pyright: ignore[reportArgumentType]
        user_id = access_token["user_id"]
        return cast(Any, User.objects.get(id=user_id))
    except (TokenError, KeyError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        if token:
            scope["user"] = cast(Any, await get_user_from_token(token))
        else:
            scope["user"] = cast(Any, AnonymousUser())

        return await super().__call__(scope, receive, send)

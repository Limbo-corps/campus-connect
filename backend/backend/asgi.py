"""
ASGI config for backend project.

Exposes the ASGI callable as a module-level variable named ``application``.

Routes plain HTTP to Django's ASGI app and WebSocket traffic through the
Channels stack (JWT auth middleware -> chat routing).

https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# Initialise Django before importing anything that touches the app registry
# (the routing module imports consumers, which import models).
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

from chat.middleware import JWTAuthMiddleware  # noqa: E402
from chat.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
    }
)

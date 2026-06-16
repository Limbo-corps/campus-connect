"""Help / contact endpoint.

Sends a user's message to the maintainer's address (settings.CONTACT_EMAIL).
The destination address lives only on the server — it is never returned to the
client and never appears in the frontend, so it stays private.
"""

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle


class ContactThrottle(AnonRateThrottle):
    scope = "contact"
    rate = "5/min"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ContactThrottle])
def contact(request):
    name = (request.data.get("name") or "").strip()[:120]
    reply_to = (request.data.get("email") or "").strip()[:254]
    message = (request.data.get("message") or "").strip()

    if not message:
        return Response(
            {"error": "Please include a message."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not settings.CONTACT_EMAIL:
        return Response(
            {"error": "Contact is not configured on the server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    subject = f"[Campus Connect] Help request from {name or 'a user'}"
    body = (
        f"From: {name or 'Anonymous'}\n"
        f"Reply-to: {reply_to or 'not provided'}\n"
        f"{'-' * 40}\n\n"
        f"{message}\n"
    )

    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [settings.CONTACT_EMAIL],
            fail_silently=False,
        )
    except Exception:
        return Response(
            {"error": "Could not send your message. Please try again later."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({"message": "Message sent — thanks for reaching out!"})

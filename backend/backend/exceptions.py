# core/exceptions.py
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

# Import your domain-specific exceptions
from chat.exceptions import (
    CannotLeaveOwnConversation,
    CannotRemoveConversationOwner,
    ChatException,
    ConversationNotFound,
    InvalidParticipant,
    MessageNotFound,
    MessagePermissionDenied,
    NotConversationAdmin,
    NotMutualFollowers,
    UserNotConversationParticipant,
)

logger = logging.getLogger(__name__)

_STATUS_FOR_EXCEPTION = {
    ConversationNotFound: status.HTTP_404_NOT_FOUND,
    MessageNotFound: status.HTTP_404_NOT_FOUND,
    UserNotConversationParticipant: status.HTTP_403_FORBIDDEN,
    NotConversationAdmin: status.HTTP_403_FORBIDDEN,
    MessagePermissionDenied: status.HTTP_403_FORBIDDEN,
    CannotRemoveConversationOwner: status.HTTP_403_FORBIDDEN,
    CannotLeaveOwnConversation: status.HTTP_403_FORBIDDEN,
    NotMutualFollowers: status.HTTP_403_FORBIDDEN,
}

def custom_api_exception_handler(exc, context):
    """
    Global exception handler for DRF views. Ensures all errors
    are returned as clean JSON instead of HTML blocks.
    """
    # 1. Handle custom domain exceptions
    if isinstance(exc, ChatException):
        status_code = _STATUS_FOR_EXCEPTION.get(type(exc), status.HTTP_400_BAD_REQUEST)
        return Response(
            {"detail": str(exc)},
            status=status_code
        )

    # 2. Handle built-in DRF exceptions (e.g., ValidationError, AuthenticationFailed)
    response = exception_handler(exc, context)

    # 3. Handle unexpected server errors (500s) that usually return HTML
    if response is None:
        logger.exception("Unhandled server exception encountered", exc_info=exc)
        return Response(
            {"detail": "A critical server error occurred. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response

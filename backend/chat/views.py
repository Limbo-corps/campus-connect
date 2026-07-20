import uuid
from asgiref.sync import async_to_sync
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

import logging

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
from chat.models import Conversation, ConversationParticipant, Message
from chat.realtime.dispatcher import ChatDispatcher
from chat.selectors.conversation_selector import ConversationSelector
from chat.selectors.message_selector import MessageSelector
from chat.serializers import (
    ConversationSerializer,
    MessageSerializer,
    UserPresenceSerializer,
)
from chat.services.conversation_service import ConversationService
from chat.services.message_service import MessageService
from users.models import User

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

DEFAULT_MESSAGE_PAGE_SIZE = 30
MAX_MESSAGE_PAGE_SIZE = 100


def _error(exc: ChatException) -> Response:
    code = _STATUS_FOR_EXCEPTION.get(type(exc), status.HTTP_400_BAD_REQUEST)
    return Response({"detail": str(exc)}, status=code)


def _get_conversation(conversation_id) -> Conversation:
    try:
        return ConversationSelector.get_conversation(conversation_id)
    except Conversation.DoesNotExist:
        raise ConversationNotFound()


def _require_participant(
    conversation: Conversation, user: User
) -> ConversationParticipant:
    try:
        return conversation.memberships.get(user=user)  # type: ignore[reportReturnType]
    except ConversationParticipant.DoesNotExist:
        raise UserNotConversationParticipant()


def _require_admin(conversation: Conversation, user: User) -> ConversationParticipant:
    membership = _require_participant(conversation, user)
    if not membership.is_admin and conversation.owner_id != user.id:  # type: ignore[reportUnnecessaryComparison]
        raise NotConversationAdmin()
    return membership


def _serializer_context(request):
    return {"request": request}


class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = ConversationSelector.get_user_conversations(request.user)
        data = ConversationSerializer(
            conversations,
            many=True,
            context=_serializer_context(request),
        ).data
        return Response(data)

    def post(self, request):
        participant_ids = request.data.get("participant_ids") or []
        name = request.data.get("name")

        if not isinstance(participant_ids, list) or not participant_ids:
            return Response(
                {"detail": "participant_ids must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        participants = list(User.objects.filter(id__in=participant_ids))
        if len(participants) != len(set(participant_ids)):
            return Response(
                {"detail": "One or more participants do not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            conversation = ConversationService.create_conversation(
                creator=request.user,
                participants=participants,
                name=name,
            )
        except ChatException as exc:
            return _error(exc)

        # Re-fetch via selector to ensure all optimized prefetches/select_related hooks apply
        conversation = _get_conversation(conversation.id)
        data = ConversationSerializer(
            conversation, context=_serializer_context(request)
        ).data
        return Response(data, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conversation = _get_conversation(conversation_id)
            _require_participant(conversation, request.user)
        except ChatException as exc:
            return _error(exc)

        data = ConversationSerializer(
            conversation, context=_serializer_context(request)
        ).data
        return Response(data)

    def patch(self, request, conversation_id):
        """Rename a group (admins/owner only)."""
        try:
            conversation = _get_conversation(conversation_id)
            _require_admin(conversation, request.user)

            name = request.data.get("name", "").strip()
            if not name:
                return Response(
                    {"detail": "A group name is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            conversation = ConversationService.rename_group(conversation, name)
        except ChatException as exc:
            return _error(exc)

        conversation = _get_conversation(conversation.id)
        data = ConversationSerializer(
            conversation, context=_serializer_context(request)
        ).data
        async_to_sync(ChatDispatcher.conversation_updated)(conversation)
        return Response(data)

    def delete(self, request, conversation_id):
        """Delete a conversation (owner only)."""
        try:
            conversation = _get_conversation(conversation_id)
            if conversation.owner_id != request.user.id:  # type: ignore[reportUnnecessaryComparison]
                raise NotConversationAdmin()
        except ChatException as exc:
            return _error(exc)

        async_to_sync(ChatDispatcher.conversation_deleted)(conversation)
        conversation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LeaveConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conversation = _get_conversation(conversation_id)
            _require_participant(conversation, request.user)

            if conversation.owner_id == request.user.id:  # type: ignore[reportUnnecessaryComparison]
                raise CannotLeaveOwnConversation()

            ConversationService.leave_conversation(conversation, request.user)
        except ChatException as exc:
            return _error(exc)

        async_to_sync(ChatDispatcher.conversation_updated)(conversation)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ParticipantsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        """Add a participant (admins/owner only)."""
        try:
            conversation = _get_conversation(conversation_id)
            _require_admin(conversation, request.user)

            user_id = request.data.get("user_id")
            target = User.objects.filter(id=user_id).first()
            if target is None:
                raise InvalidParticipant()

            if not request.user.is_mutual_with(target):
                raise NotMutualFollowers()

            ConversationService.add_participant(conversation, target)
        except ChatException as exc:
            return _error(exc)

        conversation = _get_conversation(conversation.id)
        async_to_sync(ChatDispatcher.participant_joined)(
            participant=ConversationParticipant(
                conversation=conversation,
                user=target,
            )
        )
        data = ConversationSerializer(
            conversation, context=_serializer_context(request)
        ).data
        return Response(data, status=status.HTTP_201_CREATED)

    def delete(self, request, conversation_id, user_id):
        """Remove a participant (admins/owner only)."""
        try:
            conversation = _get_conversation(conversation_id)
            _require_admin(conversation, request.user)

            target = User.objects.filter(id=user_id).first()
            if target is None:
                raise InvalidParticipant()

            if conversation.owner_id == target.id:  # type: ignore[reportUnnecessaryComparison]
                raise CannotRemoveConversationOwner()

            ConversationService.remove_participant(conversation, target)
        except ChatException as exc:
            return _error(exc)

        conversation = _get_conversation(conversation.id)
        async_to_sync(ChatDispatcher.participant_left)(
            participant=ConversationParticipant(
                conversation=conversation,
                user=target,
            )
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessagesView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, conversation_id):
        try:
            conversation = _get_conversation(conversation_id)
            _require_participant(conversation, request.user)
        except ChatException as exc:
            return _error(exc)

        try:
            limit = int(request.query_params.get("limit", DEFAULT_MESSAGE_PAGE_SIZE))
        except (TypeError, ValueError):
            limit = DEFAULT_MESSAGE_PAGE_SIZE
        limit = max(1, min(limit, MAX_MESSAGE_PAGE_SIZE))

        before = None
        before_id = request.query_params.get("before")
        if before_id:
            before = MessageSelector.get_message(before_id)

        page, has_more = MessageSelector.get_messages_page(
            conversation, before=before, limit=limit
        )

        data = MessageSerializer(
            page, many=True, context=_serializer_context(request)
        ).data
        return Response({"results": data, "has_more": has_more})

    def post(self, request, conversation_id):
        try:
            conversation = _get_conversation(conversation_id)
            _require_participant(conversation, request.user)

            content = request.data.get("content", "")
            attachment = request.FILES.get("attachment")
            message_type = request.data.get("type", Message.MessageType.TEXT)

            reply_to = None
            reply_to_id = request.data.get("reply_to")
            if reply_to_id:
                reply_to = MessageSelector.get_conversation_message(
                    conversation, reply_to_id
                )

            message = MessageService.send_message(
                conversation=conversation,
                sender=request.user,
                content=content or "",
                attachment=attachment,
                message_type=message_type,
                reply_to=reply_to,
            )
        except ChatException as exc:
            return _error(exc)

        message = MessageSelector.get_message(message.id)
        data = MessageSerializer(message, context=_serializer_context(request)).data

        async_to_sync(ChatDispatcher.message_created)(message)
        async_to_sync(ChatDispatcher.conversation_updated)(conversation)

        return Response(data, status=status.HTTP_201_CREATED)


class MessageDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_message(self, message_id) -> Message:
        try:
            return MessageSelector.get_message(message_id)
        except Message.DoesNotExist:
            raise MessageNotFound()

    def patch(self, request, message_id):
        try:
            message = self._get_message(message_id)
            content = request.data.get("content", "").strip()
            if not content:
                return Response(
                    {"detail": "Message content cannot be empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            message = MessageService.edit_message(
                message=message, user=request.user, content=content
            )
        except ChatException as exc:
            return _error(exc)

        message = MessageSelector.get_message(message.id)
        data = MessageSerializer(message, context=_serializer_context(request)).data

        async_to_sync(ChatDispatcher.message_updated)(message)
        conversation = ConversationSelector.get_conversation(message.conversation_id)  # type: ignore[reportReturnType]
        async_to_sync(ChatDispatcher.conversation_updated)(conversation)
        return Response(data)

    def delete(self, request, message_id):
        try:
            message = self._get_message(message_id)
            message = MessageService.delete_message(message=message, user=request.user)
        except ChatException as exc:
            return _error(exc)

        message = MessageSelector.get_message(message.id)
        data = MessageSerializer(message, context=_serializer_context(request)).data
        async_to_sync(ChatDispatcher.message_deleted)(message)
        return Response(data)


class ReactionsView(APIView):
    """Toggle an emoji reaction on a message."""

    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            message = MessageSelector.get_message(message_id)
        except Message.DoesNotExist:
            return _error(MessageNotFound())

        emoji = (request.data.get("emoji") or "").strip()
        if not emoji:
            return Response(
                {"detail": "An emoji is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            _require_participant(message.conversation, request.user)
            MessageService.toggle_reaction(message, request.user, emoji)
        except ChatException as exc:
            return _error(exc)

        message = MessageSelector.get_message(message.id)
        data = MessageSerializer(message, context=_serializer_context(request)).data
        async_to_sync(ChatDispatcher.message_updated)(message)
        return Response(data)


class MarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conversation = _get_conversation(conversation_id)
            _require_participant(conversation, request.user)

            message_id = request.data.get("message_id")

            if message_id:
                try:
                    uuid.UUID(str(message_id))
                except (ValueError, TypeError):
                    return Response(
                        {
                            "detail": "Invalid message identifier format. Temporary message IDs cannot be marked read."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                message = MessageSelector.get_conversation_message(
                    conversation,
                    message_id,
                )
            else:
                message = MessageSelector.get_last_message(conversation)

            if message is None:
                return Response(
                    {"detail": "No message to mark as read."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            MessageService.mark_as_read(
                conversation,
                request.user,
                message,
            )

            message = MessageSelector.get_message(message.id)

        except ChatException as exc:
            return _error(exc)

        async_to_sync(ChatDispatcher.message_updated)(message)

        # Broadcast a read-receipt so clients can update participants' last_read_message
        try:
            async_to_sync(ChatDispatcher.read_receipt_updated)(
                conversation=conversation,
                user=request.user,
                last_read_message_id=str(message.id),
                last_read_at_iso=timezone.now().isoformat(),
            )
        except Exception:
            # Log broadcasting failures so they can be diagnosed; do not fail
            # the API call for end-users.
            logger = logging.getLogger(__name__)
            logger.exception(
                "Failed to broadcast read-receipt for conversation %s by user %s",
                conversation.id,
                getattr(request.user, "id", None),
            )

        return Response(
            {
                "last_read_message": str(message.id),
            }
        )


class UserPresenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            serializer = UserPresenceSerializer(request.user.presence)
            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )
        except ChatException as exc:
            return _error(exc)

    def patch(self, request):
        try:
            serializer = UserPresenceSerializer(
                request.user.presence,
                data=request.data,
                partial=True,
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

            presence = dict(serializer.data)
            contacts = ConversationSelector.get_contacts(request.user)

            async_to_sync(ChatDispatcher.presence_updated)(
                users=contacts + [request.user],
                user=request.user,
                presence=presence,
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )
        except ChatException as exc:
            return _error(exc)

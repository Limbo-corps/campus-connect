from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
from chat.realtime import broadcast_to_conversation, send_to_users
from chat.selectors.conversation_selector import ConversationSelector
from chat.selectors.message_selector import MessageSelector
from chat.serializers import (
    ConversationSerializer,
    MessageSerializer,
)
from chat.services.conversation_service import ConversationService
from chat.services.message_service import MessageService

User = get_user_model()

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
        return ConversationSelector.get_conversations(conversation_id)
    except Conversation.DoesNotExist:
        raise ConversationNotFound()


def _require_participant(conversation, user) -> ConversationParticipant:
    membership = conversation.memberships.filter(user=user).first()
    if membership is None:
        raise UserNotConversationParticipant()
    return membership


def _require_admin(conversation, user) -> ConversationParticipant:
    membership = _require_participant(conversation, user)
    if not membership.is_admin and conversation.owner_id != user.id:
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

        conversation = _get_conversation(conversation.id)
        data = ConversationSerializer(
            conversation, context=_serializer_context(request)
        ).data

        # Notify every participant so their conversation list updates live.
        broadcast_to_conversation(conversation, "conversation.created", data)

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
        broadcast_to_conversation(conversation, "conversation.updated", data)
        return Response(data)

    def delete(self, request, conversation_id):
        """Delete a conversation (owner only)."""
        try:
            conversation = _get_conversation(conversation_id)
            if conversation.owner_id != request.user.id:
                raise NotConversationAdmin()
        except ChatException as exc:
            return _error(exc)

        participant_ids = list(
            conversation.memberships.values_list("user_id", flat=True)
        )
        conversation_id_str = str(conversation.id)
        conversation.delete()

        send_to_users(
            participant_ids,
            "conversation.deleted",
            {"id": conversation_id_str},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class LeaveConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conversation = _get_conversation(conversation_id)
            _require_participant(conversation, request.user)

            if conversation.owner_id == request.user.id:
                raise CannotLeaveOwnConversation()

            ConversationService.leave_conversation(conversation, request.user)
        except ChatException as exc:
            return _error(exc)

        _broadcast_participant_change(
            conversation, request.user, joined=False, actor=request.user
        )
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

            # Only people who follow the inviter back can be added.
            if not request.user.is_mutual_with(target):
                raise NotMutualFollowers()

            ConversationService.add_participant(conversation, target)
        except ChatException as exc:
            return _error(exc)

        conversation = _get_conversation(conversation.id)
        _broadcast_participant_change(
            conversation, target, joined=True, actor=request.user
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

            if conversation.owner_id == target.id:
                raise CannotRemoveConversationOwner()

            ConversationService.remove_participant(conversation, target)
        except ChatException as exc:
            return _error(exc)

        conversation = _get_conversation(conversation.id)
        _broadcast_participant_change(
            conversation, target, joined=False, actor=request.user
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

        qs = (
            Message.objects.filter(conversation=conversation)
            .select_related("sender", "reply_to", "reply_to__sender")
            .prefetch_related("reactions")
            .order_by("-created_at")
        )

        before = request.query_params.get("before")
        if before:
            anchor = Message.objects.filter(id=before).first()
            if anchor is not None:
                qs = qs.filter(created_at__lt=anchor.created_at)

        page = list(qs[: limit + 1])
        has_more = len(page) > limit
        page = page[:limit]
        page.reverse()  # ascending for display

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
                reply_to = Message.objects.filter(
                    id=reply_to_id, conversation=conversation
                ).first()

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
        data = MessageSerializer(
            message, context=_serializer_context(request)
        ).data

        broadcast_to_conversation(conversation, "message.new", data)
        # Refresh conversation ordering / last-message preview for all lists.
        _broadcast_conversation_snapshot(conversation, request)

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
        data = MessageSerializer(
            message, context=_serializer_context(request)
        ).data
        broadcast_to_conversation(message.conversation, "message.edited", data)
        return Response(data)

    def delete(self, request, message_id):
        try:
            message = self._get_message(message_id)
            message = MessageService.delete_message(
                message=message, user=request.user
            )
        except ChatException as exc:
            return _error(exc)

        message = MessageSelector.get_message(message.id)
        data = MessageSerializer(
            message, context=_serializer_context(request)
        ).data
        broadcast_to_conversation(message.conversation, "message.deleted", data)
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
        data = MessageSerializer(
            message, context=_serializer_context(request)
        ).data
        broadcast_to_conversation(message.conversation, "message.reaction", data)
        return Response(data)


class MarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conversation = _get_conversation(conversation_id)
            _require_participant(conversation, request.user)

            message_id = request.data.get("message_id")
            if message_id:
                message = Message.objects.filter(
                    id=message_id, conversation=conversation
                ).first()
            else:
                message = MessageSelector.get_last_message(conversation)

            if message is None:
                return Response({"detail": "No message to mark as read."})

            MessageService.mark_as_read(conversation, request.user, message)
        except ChatException as exc:
            return _error(exc)

        broadcast_to_conversation(
            conversation,
            "read.receipt",
            {
                "conversation": str(conversation.id),
                "user_id": str(request.user.id),
                "last_read_message": str(message.id),
            },
        )
        return Response({"last_read_message": str(message.id)})


def _broadcast_participant_change(conversation, target_user, *, joined, actor):
    from chat.serializers import ChatUserSerializer

    payload = {
        "conversation": str(conversation.id),
        "user": ChatUserSerializer(target_user).data,
        "actor": ChatUserSerializer(actor).data,
    }
    event = "participant.added" if joined else "participant.removed"

    # Notify remaining participants plus the affected user themselves.
    user_ids = list(conversation.memberships.values_list("user_id", flat=True))
    user_ids.append(target_user.id)
    send_to_users(user_ids, event, payload)


def _broadcast_conversation_snapshot(conversation, request):
    """Push a fresh conversation object so each client re-sorts its list."""
    fresh = _get_conversation(conversation.id)
    data = ConversationSerializer(
        fresh, context=_serializer_context(request)
    ).data
    broadcast_to_conversation(fresh, "conversation.updated", data)

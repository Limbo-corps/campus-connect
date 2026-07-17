class ChatException(Exception):
    """Base exception for all chat related errors."""

    default_message = "A chat error occurred."

    def __init__(self, message: str | None = None):
        super().__init__(message or self.default_message)


class ConversationNotFound(ChatException):
    default_message = "Conversation not found."


class MessageNotFound(ChatException):
    default_message = "Message not found."


class UserNotConversationParticipant(ChatException):
    default_message = "User is not a participant of this conversation."


class ConversationAlreadyExists(ChatException):
    default_message = "Conversation already exists."


class InvalidConversation(ChatException):
    default_message = "Invalid conversation."


class InvalidParticipant(ChatException):
    default_message = "Invalid participant."


class CannotMessageYourself(ChatException):
    default_message = "You cannot message yourself."


class NotMutualFollowers(ChatException):
    default_message = "You can only message people who follow you back."


class AlreadyConversationParticipant(ChatException):
    default_message = "User is already a participant."


class NotConversationAdmin(ChatException):
    default_message = "Only administrators can perform this action."


class CannotRemoveConversationOwner(ChatException):
    default_message = "Conversation owner cannot be removed."


class CannotLeaveOwnConversation(ChatException):
    default_message = "Conversation owner cannot leave the conversation."


class MessagePermissionDenied(ChatException):
    default_message = "You do not have permission to modify this message."


class EmptyMessage(ChatException):
    default_message = "A message must contain content or an attachment."


class InvalidMessageType(ChatException):
    default_message = "Invalid message type."

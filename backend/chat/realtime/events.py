"""
Central definition of all realtime websocket events.

WHY THIS FILE EXISTS
--------------------

The frontend and backend communicate through websocket events.

Instead of hardcoding event names throughout the project, every event should
be defined here.

Benefits
--------
• Eliminates typo-related bugs.
• Makes it easy to discover every supported realtime event.
• Serves as documentation for frontend developers.
• Makes refactoring event names trivial.
"""


class ChatEvents:
    """
    Canonical websocket event names.

    Event naming convention:

        <resource>.<action>

    Examples:
        message.created
        message.updated
        typing.started
        presence.updated
    """

    # ------------------------------------------------------------------
    # Message Events
    # ------------------------------------------------------------------

    MESSAGE_CREATED = "message.created"
    MESSAGE_UPDATED = "message.updated"
    MESSAGE_DELETED = "message.deleted"

    # ------------------------------------------------------------------
    # Reaction Events
    # ------------------------------------------------------------------

    REACTION_ADDED = "reaction.added"
    REACTION_REMOVED = "reaction.removed"
    REACTION_UPDATED = "reaction.updated"

    # ------------------------------------------------------------------
    # Typing Events
    # ------------------------------------------------------------------

    TYPING_STARTED = "typing.started"
    TYPING_STOPPED = "typing.stopped"

    # ------------------------------------------------------------------
    # Presence Events
    # ------------------------------------------------------------------

    PRESENCE_UPDATED = "presence.updated"
    PRESENCE_SNAPSHOT = "presence.snapshot"

    # ------------------------------------------------------------------
    # Read Receipt Events
    # ------------------------------------------------------------------

    READ_RECEIPT_UPDATED = "read_receipt.updated"

    # ------------------------------------------------------------------
    # Conversation Events
    # ------------------------------------------------------------------

    CONVERSATION_CREATED = "conversation.created"
    CONVERSATION_UPDATED = "conversation.updated"
    CONVERSATION_DELETED = "conversation.deleted"

    PARTICIPANT_JOINED = "participant.joined"
    PARTICIPANT_LEFT = "participant.left"

    # ------------------------------------------------------------------
    # Group Events
    # ------------------------------------------------------------------

    GROUP_RENAMED = "group.renamed"
    GROUP_IMAGE_UPDATED = "group.image_updated"
    GROUP_OWNER_CHANGED = "group.owner_changed"
    GROUP_ADMIN_UPDATED = "group.admin_updated"

    # ------------------------------------------------------------------
    # Notification Events
    # ------------------------------------------------------------------

    NOTIFICATION_CREATED = "notification.created"

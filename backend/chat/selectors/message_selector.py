from chat.models import Message


class MessageSelector:
    @staticmethod
    def get_messages(conversation):
        return (
            Message.objects.filter(
                conversation=conversation,
            )
            .select_related("sender")
            .order_by("created_at")
        )

    @staticmethod
    def get_last_message(conversation):
        return (
            Message.objects.filter(
                conversation=conversation,
            )
            .order_by("-created_at")
            .first()
        )

    @staticmethod
    def get_message(message_id):
        return (
            Message.objects.select_related(
                "sender",
                "conversation",
                "reply_to",
                "reply_to__sender",
            )
            .prefetch_related("reactions")
            .get(id=message_id)
        )

    @staticmethod
    def unread_count(conversation, participant):
        membership = conversation.memberships.get(
            user=participant,
        )

        if membership.last_read_message is None:
            return Message.objects.filter(
                conversation=conversation,
            ).count()

        return (
            Message.objects.filter(
                conversation=conversation,
                created_at__gt=membership.last_read_message.created_at,
            )
            .exclude(
                sender=participant,
            )
            .count()
        )

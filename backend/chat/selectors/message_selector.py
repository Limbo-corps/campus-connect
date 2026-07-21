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
            .prefetch_related("reactions__user")
            .get(id=message_id)
        )

    @staticmethod
    def get_conversation_message(conversation, message_id):
        return (
            Message.objects.filter(
                conversation=conversation,
                id=message_id,
            )
            .select_related(
                "sender",
                "conversation",
                "reply_to",
                "reply_to__sender",
            )
            .prefetch_related("reactions__user")
            .first()
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

    @staticmethod
    def get_messages_page(
        conversation,
        *,
        before=None,
        limit=30,
    ):
        qs = (
            Message.objects.filter(conversation=conversation)
            .select_related(
                "sender",
                "reply_to",
                "reply_to__sender",
            )
            .prefetch_related("reactions__user")
            .order_by("-created_at")
        )

        if before is not None:
            qs = qs.filter(created_at__lt=before.created_at)

        page = list(qs[: limit + 1])

        has_more = len(page) > limit
        page = page[:limit]
        page.reverse()

        return page, has_more

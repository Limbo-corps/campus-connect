from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from chat.models import Conversation, ConversationParticipant, Message
from chat.services.conversation_service import ConversationService
from users.models import Follow

User = get_user_model()


def make_user(username):
    return User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="pass1234!x",
    )


def make_mutual(*users):
    """Make every pair of the given users follow each other (DM prerequisite)."""
    for a in users:
        for b in users:
            if a != b:
                Follow.objects.get_or_create(follower=a, following=b)


class ConversationRestTests(TestCase):
    def setUp(self):
        self.alice = make_user("alice")
        self.bob = make_user("bob")
        self.carol = make_user("carol")
        make_mutual(self.alice, self.bob, self.carol)
        self.client = APIClient()
        self.client.force_authenticate(self.alice)

    def test_create_direct_conversation(self):
        res = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [str(self.bob.id)]},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertFalse(res.data["is_group"])
        self.assertEqual(res.data["other_user"]["username"], "bob")

    def test_direct_conversation_is_reused_not_duplicated(self):
        first = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [str(self.bob.id)]},
            format="json",
        )
        second = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [str(self.bob.id)]},
            format="json",
        )
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(Conversation.objects.filter(is_group=False).count(), 1)

    def test_create_group_conversation(self):
        res = self.client.post(
            "/api/chat/conversations/",
            {
                "participant_ids": [str(self.bob.id), str(self.carol.id)],
                "name": "Study Group",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["is_group"])
        self.assertEqual(res.data["display_name"], "Study Group")
        self.assertEqual(len(res.data["participants_detail"]), 3)

    def test_list_ordered_by_latest_activity(self):
        conv1 = ConversationService.create_direct_conversation(self.alice, self.bob)
        conv2 = ConversationService.create_direct_conversation(self.alice, self.carol)
        # Send a message in the older conversation -> it should jump to the top.
        self.client.post(
            f"/api/chat/conversations/{conv1.id}/messages/",
            {"content": "hi"},
            format="json",
        )
        res = self.client.get("/api/chat/conversations/")
        self.assertEqual(res.data[0]["id"], str(conv1.id))
        self.assertEqual(res.data[1]["id"], str(conv2.id))

    def test_non_participant_cannot_view(self):
        conv = ConversationService.create_direct_conversation(self.bob, self.carol)
        res = self.client.get(f"/api/chat/conversations/{conv.id}/")
        self.assertEqual(res.status_code, 403)


class MutualFollowGateTests(TestCase):
    """You may only start a conversation with people who follow you back."""

    def setUp(self):
        self.alice = make_user("alice")
        self.bob = make_user("bob")
        self.carol = make_user("carol")
        self.client = APIClient()
        self.client.force_authenticate(self.alice)

    def test_cannot_dm_when_not_following(self):
        res = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [str(self.bob.id)]},
            format="json",
        )
        self.assertEqual(res.status_code, 403)
        self.assertEqual(Conversation.objects.count(), 0)

    def test_cannot_dm_when_only_one_direction_follows(self):
        # Alice follows Bob, but Bob does not follow Alice back.
        Follow.objects.create(follower=self.alice, following=self.bob)
        res = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [str(self.bob.id)]},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_can_dm_once_mutual(self):
        make_mutual(self.alice, self.bob)
        res = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [str(self.bob.id)]},
            format="json",
        )
        self.assertEqual(res.status_code, 201)

    def test_group_requires_all_members_mutual(self):
        make_mutual(self.alice, self.bob)  # but not carol
        res = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [str(self.bob.id), str(self.carol.id)]},
            format="json",
        )
        self.assertEqual(res.status_code, 403)


class MessageRestTests(TestCase):
    def setUp(self):
        self.alice = make_user("alice")
        self.bob = make_user("bob")
        make_mutual(self.alice, self.bob)
        self.conv = ConversationService.create_direct_conversation(self.alice, self.bob)
        self.client = APIClient()
        self.client.force_authenticate(self.alice)

    def test_send_and_fetch_messages(self):
        self.client.post(
            f"/api/chat/conversations/{self.conv.id}/messages/",
            {"content": "hello bob"},
            format="json",
        )
        res = self.client.get(f"/api/chat/conversations/{self.conv.id}/messages/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["content"], "hello bob")
        self.assertFalse(res.data["has_more"])

    def test_empty_message_rejected(self):
        res = self.client.post(
            f"/api/chat/conversations/{self.conv.id}/messages/",
            {"content": "   "},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_edit_own_message(self):
        msg = Message.objects.create(
            conversation=self.conv, sender=self.alice, content="typo"
        )
        res = self.client.patch(
            f"/api/chat/messages/{msg.id}/",
            {"content": "fixed"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["content"], "fixed")
        self.assertTrue(res.data["is_edited"])

    def test_cannot_edit_others_message(self):
        msg = Message.objects.create(
            conversation=self.conv, sender=self.bob, content="bob's msg"
        )
        res = self.client.patch(
            f"/api/chat/messages/{msg.id}/",
            {"content": "hacked"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_delete_own_message_soft_deletes(self):
        msg = Message.objects.create(
            conversation=self.conv, sender=self.alice, content="oops"
        )
        res = self.client.delete(f"/api/chat/messages/{msg.id}/")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["is_deleted"])
        msg.refresh_from_db()
        self.assertIsNotNone(msg.deleted_at)
        self.assertEqual(msg.content, "")

    def test_toggle_reaction(self):
        msg = Message.objects.create(
            conversation=self.conv, sender=self.bob, content="react to me"
        )
        # Add a reaction.
        res = self.client.post(
            f"/api/chat/messages/{msg.id}/reactions/",
            {"emoji": "🔥"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["reactions"]), 1)
        group = res.data["reactions"][0]
        self.assertEqual(group["emoji"], "🔥")
        self.assertEqual(group["count"], 1)
        self.assertIn(str(self.alice.id), group["user_ids"])
        # The tooltip needs real usernames, not a placeholder (issue #15).
        self.assertEqual(
            group["users"],
            [{"id": str(self.alice.id), "name": self.alice.username}],
        )

        # Toggling the same emoji removes it.
        res = self.client.post(
            f"/api/chat/messages/{msg.id}/reactions/",
            {"emoji": "🔥"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["reactions"], [])

    def test_mark_read_and_unread_count(self):
        for text in ("m1", "m2"):
            Message.objects.create(
                conversation=self.conv, sender=self.bob, content=text
            )
        res = self.client.get("/api/chat/conversations/")
        alice_conv = next(c for c in res.data if c["id"] == str(self.conv.id))
        self.assertEqual(alice_conv["unread_count"], 2)

        last = Message.objects.filter(conversation=self.conv).last()
        self.client.post(
            f"/api/chat/conversations/{self.conv.id}/read/",
            {"message_id": str(last.id)},
            format="json",
        )
        res = self.client.get("/api/chat/conversations/")
        alice_conv = next(c for c in res.data if c["id"] == str(self.conv.id))
        self.assertEqual(alice_conv["unread_count"], 0)


class GroupPermissionTests(TestCase):
    def setUp(self):
        self.owner = make_user("owner")
        self.member = make_user("member")
        self.outsider = make_user("outsider")
        make_mutual(self.owner, self.member, self.outsider)
        self.conv = ConversationService.create_group_conversation(
            creator=self.owner,
            participants=[self.member],
            name="Team",
        )

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user)
        return c

    def test_only_admin_can_rename(self):
        res = self._client(self.member).patch(
            f"/api/chat/conversations/{self.conv.id}/",
            {"name": "Renamed"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

        res = self._client(self.owner).patch(
            f"/api/chat/conversations/{self.conv.id}/",
            {"name": "Renamed"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["name"], "Renamed")

    def test_admin_can_add_participant(self):
        res = self._client(self.owner).post(
            f"/api/chat/conversations/{self.conv.id}/participants/",
            {"user_id": str(self.outsider.id)},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertTrue(
            ConversationParticipant.objects.filter(
                conversation=self.conv, user=self.outsider
            ).exists()
        )

    def test_member_cannot_add_participant(self):
        res = self._client(self.member).post(
            f"/api/chat/conversations/{self.conv.id}/participants/",
            {"user_id": str(self.outsider.id)},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_owner_cannot_be_removed(self):
        res = self._client(self.owner).delete(
            f"/api/chat/conversations/{self.conv.id}/participants/{self.owner.id}/"
        )
        self.assertEqual(res.status_code, 403)

    def test_owner_cannot_leave(self):
        res = self._client(self.owner).post(
            f"/api/chat/conversations/{self.conv.id}/leave/"
        )
        self.assertEqual(res.status_code, 403)

    def test_member_can_leave(self):
        res = self._client(self.member).post(
            f"/api/chat/conversations/{self.conv.id}/leave/"
        )
        self.assertEqual(res.status_code, 204)
        self.assertFalse(
            ConversationParticipant.objects.filter(
                conversation=self.conv, user=self.member
            ).exists()
        )

    def test_owner_can_delete(self):
        res = self._client(self.owner).delete(
            f"/api/chat/conversations/{self.conv.id}/"
        )
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Conversation.objects.filter(id=self.conv.id).exists())

    def test_member_cannot_delete_group(self):
        res = self._client(self.member).delete(
            f"/api/chat/conversations/{self.conv.id}/"
        )
        self.assertEqual(res.status_code, 403)
        self.assertTrue(Conversation.objects.filter(id=self.conv.id).exists())


class ReadReceiptSerializationTests(TestCase):
    """Read receipts are cumulative and derived from last_read_message: the
    serializer exposes last_read_at (= that message's timestamp) so the client
    can mark every earlier message seen (issue #17)."""

    def setUp(self):
        self.alice = make_user("alice")
        self.bob = make_user("bob")
        make_mutual(self.alice, self.bob)
        self.conv = ConversationService.create_direct_conversation(
            self.alice, self.bob
        )

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user)
        return c

    def test_last_read_at_is_the_last_read_message_timestamp(self):
        m1 = Message.objects.create(
            conversation=self.conv, sender=self.bob, content="1"
        )
        m2 = Message.objects.create(
            conversation=self.conv, sender=self.bob, content="2"
        )

        # Alice reads up to m2.
        res = self._client(self.alice).post(
            f"/api/chat/conversations/{self.conv.id}/read/",
            {"message_id": str(m2.id)},
            format="json",
        )
        self.assertEqual(res.status_code, 200)

        # Bob's view of Alice's membership carries last_read_at == m2's time,
        # which is >= m1's time → m1 is cumulatively "seen".
        res = self._client(self.bob).get("/api/chat/conversations/")
        conv = next(c for c in res.data if c["id"] == str(self.conv.id))
        alice_p = next(
            p
            for p in conv["participants_detail"]
            if p["user"]["username"] == "alice"
        )
        self.assertEqual(str(alice_p["last_read_message"]), str(m2.id))
        self.assertIsNotNone(alice_p["last_read_at"])
        self.assertGreaterEqual(
            alice_p["last_read_at"], m1.created_at.isoformat()
        )


class DirectMessageLifecycleTests(TestCase):
    """DMs are per-user: deleting hides only for you and reappears on a new
    message; there is no owner-gated global delete (issue #18)."""

    def setUp(self):
        self.alice = make_user("alice")
        self.bob = make_user("bob")
        make_mutual(self.alice, self.bob)
        self.conv = ConversationService.create_direct_conversation(
            self.alice, self.bob
        )

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user)
        return c

    def _list_ids(self, user):
        res = self._client(user).get("/api/chat/conversations/")
        return [c["id"] for c in res.data]

    def test_delete_dm_hides_only_for_that_user(self):
        res = self._client(self.alice).delete(
            f"/api/chat/conversations/{self.conv.id}/"
        )
        self.assertEqual(res.status_code, 204)
        self.assertNotIn(str(self.conv.id), self._list_ids(self.alice))
        self.assertIn(str(self.conv.id), self._list_ids(self.bob))
        # The conversation is NOT globally deleted.
        self.assertTrue(Conversation.objects.filter(id=self.conv.id).exists())

    def test_non_creator_can_hide_dm(self):
        # Bob didn't create the DM (alice did) but can still remove it.
        res = self._client(self.bob).delete(
            f"/api/chat/conversations/{self.conv.id}/"
        )
        self.assertEqual(res.status_code, 204)
        self.assertNotIn(str(self.conv.id), self._list_ids(self.bob))
        self.assertIn(str(self.conv.id), self._list_ids(self.alice))

    def test_new_message_restores_hidden_dm(self):
        self._client(self.alice).delete(
            f"/api/chat/conversations/{self.conv.id}/"
        )
        self.assertNotIn(str(self.conv.id), self._list_ids(self.alice))

        # Bob messages → the DM reappears for alice.
        self._client(self.bob).post(
            f"/api/chat/conversations/{self.conv.id}/messages/",
            {"content": "you there?"},
            format="json",
        )
        self.assertIn(str(self.conv.id), self._list_ids(self.alice))

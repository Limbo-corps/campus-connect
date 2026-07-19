"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Spinner } from "@heroui/react";
import useSWR from "swr";

import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useCampuses } from "@/hooks/useCampuses";
import { useMessages, type LocalMessage } from "@/hooks/useMessages";
import * as chatApi from "@/lib/chat/api";
import { getUserByUsername } from "@/lib/users/api";
import { otherParticipant } from "@/lib/chat/format";
import type { Conversation } from "@/types";

import AddParticipantModal from "@/components/chat/AddParticipantModal";
import type { SendInput } from "@/hooks/useMessages";
import { BOT_USER, isBotCommand, runBotCommand } from "@/lib/chat/bot";

// Sub-components
import { ChatThreadCentral } from "@/components/chat/ChatThreadCentral";
import { ChatRightRail } from "@/components/chat/ChatRightRail";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = typeof params?.id === "string" ? params.id : "";

  const { user } = useAuth();
  const meId = user?.id ?? null;
  const currentCampusId = user?.campus;

  const { campuses } = useCampuses();
  const {
    conversations,
    isOnline,
    typing,
    setActiveConversation,
    markRead,
    sendTyping,
    removeConversation,
    refresh,
  } = useChat();

  const activeCampus = useMemo(() => {
    if (!currentCampusId || !campuses) return null;
    return campuses.find((c) => c.id === currentCampusId) ?? null;
  }, [currentCampusId, campuses]);

  const {
    messages,
    loading,
    hasMore,
    loadingOlder,
    loadOlder,
    send,
    edit,
    remove,
    react,
  } = useMessages(conversationId);

  const listConversation = conversations.find((c) => c.id === conversationId);
  const [fetched, setFetched] = useState<Conversation | null>(null);
  const conversation = listConversation ?? fetched;
  const [notFound, setNotFound] = useState(false);

  const [replyTo, setReplyTo] = useState<LocalMessage | null>(null);
  const [editing, setEditing] = useState<LocalMessage | null>(null);
  const [addPeopleOpen, setAddPeopleOpen] = useState(false);
  const [botMessages, setBotMessages] = useState<LocalMessage[]>([]);

  const checkUserOnlineStatus = useCallback(
    (userId?: string) => {
      if (!userId) return false;
      return typeof isOnline === "function"
        ? isOnline(userId)
        : !!isOnline?.[userId];
    },
    [isOnline],
  );

  useEffect(() => {
    if (!conversationId || listConversation) return;
    let isMounted = true;

    chatApi
      .getConversation(conversationId)
      .then((c) => {
        if (isMounted) setFetched(c);
      })
      .catch(() => {
        if (isMounted) setNotFound(true);
      });

    return () => {
      isMounted = false;
    };
  }, [conversationId, listConversation]);

  const otherBase = useMemo(() => {
    if (!conversation) return null;
    return otherParticipant(conversation, meId);
  }, [conversation, meId]);

  const { data: fullOtherProfile } = useSWR(
    conversation?.is_group || !otherBase?.username
      ? null
      : ["chat-user", otherBase.username],
    () => getUserByUsername(otherBase!.username),
  );

  const other = useMemo(() => {
    if (!otherBase) return null;

    // Construct a ChatUser-shaped object using the lightweight otherBase
    // and any enriched profile fields we fetched. Avoid propagating
    // server-side-only fields (like email) that don't belong on ChatUser.
    return {
      id: otherBase.id,
      username: otherBase.username,
      first_name: fullOtherProfile?.first_name ?? otherBase.first_name ?? "",
      last_name: fullOtherProfile?.last_name ?? otherBase.last_name ?? "",
      avatar_url: fullOtherProfile?.avatar_url ?? otherBase.avatar_url ?? "",
    };
  }, [otherBase, fullOtherProfile]);

  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    if (!conversationId || loading || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last && !last.pending) {
      void markRead(conversationId, last.id);
    }
  }, [conversationId, loading, messages, markRead]);

  const handleTyping = useCallback(
    (isTyping: boolean) => sendTyping(conversationId, isTyping),
    [sendTyping, conversationId],
  );

  const handleDelete = useCallback(
    async (message: LocalMessage) => {
      if (window.confirm("Delete this message?")) await remove(message.id);
    },
    [remove],
  );

  const handleReact = useCallback(
    (message: LocalMessage, emoji: string) => react(message.id, emoji),
    [react],
  );

  const handleSend = useCallback(
    async (input: SendInput) => {
      const content = (input.content ?? "").trim();
      if (!input.attachment && isBotCommand(content)) {
        const outcome = runBotCommand(content);
        if (outcome) {
          const now = Date.now();
          const shared = {
            conversation: conversationId,
            type: "TEXT" as const,
            attachment_url: null,
            reply_to: null,
            edited_at: null,
            deleted_at: null,
            is_deleted: false,
            is_edited: false,
            reactions: [],
            ephemeral: true,
          };
          const me: LocalMessage = {
            ...shared,
            id: `bot-echo-${now}`,
            sender: {
              id: user?.id ?? "me",
              username: user?.username ?? "you",
              first_name: user?.first_name ?? "",
              last_name: user?.last_name ?? "",
              avatar_url: user?.avatar_url ?? "",
            },
            content: outcome.echo,
            created_at: new Date(now).toISOString(),
          };
          const reply: LocalMessage = {
            ...shared,
            id: `bot-reply-${now}`,
            sender: BOT_USER,
            bot: true,
            content: outcome.reply,
            created_at: new Date(now + 1).toISOString(),
          };
          setBotMessages((prev) => [...prev, me, reply]);
          setReplyTo(null);
          return;
        }
      }
      await send(input);
    },
    [send, conversationId, user],
  );

  const allMessages = useMemo(() => {
    if (botMessages.length === 0) return messages;
    return [...messages, ...botMessages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [messages, botMessages]);

  const handleRename = useCallback(async () => {
    if (!conversation) return;
    const name = window.prompt("Group name", conversation.display_name);
    if (name && name.trim()) {
      await chatApi.renameGroup(conversation.id, name.trim());
    }
  }, [conversation]);

  const handleLeave = useCallback(async () => {
    if (!conversation) return;
    if (window.confirm("Leave this group?")) {
      await chatApi.leaveConversation(conversation.id);
      removeConversation(conversation.id);
      router.push("/chat");
    }
  }, [conversation, removeConversation, router]);

  const handleDeleteConversation = useCallback(async () => {
    if (!conversation) return;
    if (window.confirm("Delete this conversation for everyone?")) {
      await chatApi.deleteConversation(conversation.id);
      removeConversation(conversation.id);
      router.push("/chat");
    }
  }, [conversation, removeConversation, router]);

  const typingText = useMemo(() => {
    const map = typing[conversationId];
    if (!map) return null;
    const names = Object.values(map);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing…`;
    return `${names.length} people are typing…`;
  }, [typing, conversationId]);

  if (notFound) {
    return (
      <Card className="flex h-full flex-col items-center justify-center border border-[--surface-secondary] bg-[--surface] p-8 text-center">
        <p className="text-sm font-semibold text-[--foreground]">
          Conversation not found
        </p>
        <p className="mt-1 text-xs text-[--muted]">
          It may have been deleted or you were removed.
        </p>
      </Card>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-9 gap-4">
      <ChatThreadCentral
        conversation={conversation}
        meId={meId}
        user={user}
        isOnline={isOnline}
        typingText={typingText}
        loading={loading}
        loadingOlder={loadingOlder}
        hasMore={hasMore}
        allMessages={allMessages}
        replyTo={replyTo}
        editing={editing}
        other={other}
        loadOlder={loadOlder}
        setReplyTo={setReplyTo}
        setEditing={setEditing}
        handleRename={handleRename}
        handleLeave={handleLeave}
        handleDeleteConversation={handleDeleteConversation}
        handleDelete={handleDelete}
        handleReact={handleReact}
        handleSend={handleSend}
        handleTyping={handleTyping}
        edit={edit}
        setAddPeopleOpen={setAddPeopleOpen}
      />

      <ChatRightRail
        conversation={conversation}
        other={other}
        meId={meId}
        activeCampus={activeCampus}
        otherIsOnline={checkUserOnlineStatus(other?.id)}
        checkUserOnlineStatus={checkUserOnlineStatus}
      />

      <AddParticipantModal
        isOpen={addPeopleOpen}
        onOpenChange={setAddPeopleOpen}
        conversation={conversation}
        onAdded={() => void refresh()}
      />
    </div>
  );
}

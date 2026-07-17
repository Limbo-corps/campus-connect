// app/chat/[id]/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Spinner } from "@heroui/react";
import { ShieldAlert } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useMessages, type LocalMessage } from "@/hooks/useMessages";
import * as chatApi from "@/lib/chat/api";
import {
  formatDayDivider,
  otherParticipant,
  shouldGroup,
  userDisplayName,
} from "@/lib/chat/format";
import type {
  ChatEvent,
  Conversation,
  ReadReceiptPayload,
} from "@/types";

import { ThreadHeader } from "@/components/chat/ThreadHeader";
import { MessageItem } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import AddParticipantModal from "@/components/chat/AddParticipantModal";
import ChatThemeModal from "@/components/chat/ChatThemeModal";
import type { SendInput } from "@/hooks/useMessages";
import {
  DEFAULT_THEME,
  getTheme,
  onThemeChange,
  themeLayerStyles,
  type ChatTheme,
} from "@/lib/chat/themes";
import { BOT_USER, isBotCommand, runBotCommand } from "@/lib/chat/bot";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = typeof params?.id === "string" ? params.id : "";

  const { user } = useAuth();
  const meId = user?.id ?? null;
  const {
    conversations,
    isOnline,
    typing,
    setActiveConversation,
    markRead,
    sendTyping,
    subscribe,
    removeConversation,
    refresh,
  } = useChat();

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

  // Prefer the conversation from the live list; fall back to a direct fetch
  // (e.g. when the page is opened via a deep link before the list loads).
  const listConversation = conversations.find((c) => c.id === conversationId);
  const [fetched, setFetched] = useState<Conversation | null>(null);
  const conversation = listConversation ?? fetched;
  const [notFound, setNotFound] = useState(false);

  const [replyTo, setReplyTo] = useState<LocalMessage | null>(null);
  const [editing, setEditing] = useState<LocalMessage | null>(null);
  const [addPeopleOpen, setAddPeopleOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [theme, setThemeState] = useState<ChatTheme>(DEFAULT_THEME);
  const [botMessages, setBotMessages] = useState<LocalMessage[]>([]);
  const [otherLastReadAt, setOtherLastReadAt] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);

  // Fetch the conversation if it isn't in the live list.
  useEffect(() => {
    if (!conversationId || listConversation) return;
    let cancelled = false;
    chatApi
      .getConversation(conversationId)
      .then((c) => !cancelled && setFetched(c))
      .catch(() => !cancelled && setNotFound(true));
    return () => {
      cancelled = true;
    };
  }, [conversationId, listConversation]);

  // Mark this conversation active (suppresses unread + auto-marks read).
  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  // Load the per-conversation theme and keep it in sync with live edits.
  useEffect(() => {
    if (!conversationId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync theme from localStorage on conversation change
    setThemeState(getTheme(conversationId));
    setBotMessages([]); // ephemeral bot chatter doesn't cross conversations
    return onThemeChange((id) => {
      if (id === conversationId) setThemeState(getTheme(conversationId));
    });
  }, [conversationId]);

  // Mark read once the initial history has loaded.
  useEffect(() => {
    if (!conversationId || loading || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last && !last.pending) void markRead(conversationId, last.id);
  }, [conversationId, loading, messages, markRead]);

  // Seed the "other party has read" marker from the conversation snapshot.
  useEffect(() => {
    if (!conversation) return;
    const others = conversation.participants_detail?.filter(
      (p) => p.user.id !== meId,
    );
    const readIds = (others ?? [])
      .map((p) => p.last_read_message)
      .filter(Boolean) as string[];
    if (readIds.length === 0) return;
    // Find the newest message among those the others have read.
    const times = messages
      .filter((m) => readIds.includes(m.id))
      .map((m) => new Date(m.created_at).getTime());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deriving read state from the loaded snapshot
    if (times.length) setOtherLastReadAt(Math.max(...times));
  }, [conversation, messages, meId]);

  // Live read receipts from the other participant(s).
  useEffect(() => {
    if (!conversationId) return;
    const off = subscribe((event: ChatEvent) => {
      if (event.event !== "read.receipt") return;
      const data = event.data as ReadReceiptPayload;
      if (data.conversation !== conversationId || data.user_id === meId) return;
      const msg = messages.find((m) => m.id === data.last_read_message);
      if (msg) setOtherLastReadAt(new Date(msg.created_at).getTime());
    });
    return off;
  }, [conversationId, subscribe, meId, messages]);

  // Auto-scroll to the newest message when appropriate.
  useEffect(() => {
    if (loading) return;
    const grew = messages.length > prevLenRef.current;
    const last = messages[messages.length - 1];
    const mine = last?.sender.id === meId;
    const el = scrollRef.current;
    const nearBottom = el
      ? el.scrollHeight - el.scrollTop - el.clientHeight < 200
      : true;
    if (grew && (mine || nearBottom || prevLenRef.current === 0)) {
      endRef.current?.scrollIntoView({
        behavior: prevLenRef.current === 0 ? "auto" : "smooth",
      });
    }
    prevLenRef.current = messages.length;
  }, [messages, loading, meId]);

  // Infinite scroll: load older when scrolled to the top.
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el && el.scrollTop < 60 && hasMore && !loadingOlder) {
      const prevHeight = el.scrollHeight;
      void loadOlder().then(() => {
        // Preserve viewport position after prepending older messages.
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop =
              scrollRef.current.scrollHeight - prevHeight;
          }
        });
      });
    }
  }, [hasMore, loadingOlder, loadOlder]);

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

  // Intercept CampusBot slash commands: run them locally and show ephemeral
  // messages instead of sending to the backend.
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

  // Real messages plus ephemeral bot chatter, ordered by time.
  const allMessages = useMemo(() => {
    if (botMessages.length === 0) return messages;
    return [...messages, ...botMessages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [messages, botMessages]);

  const themeStyles = useMemo(() => themeLayerStyles(theme), [theme]);
  const themed = theme.id !== "default" || !!theme.image;

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

  // Typing indicator text for this conversation.
  const typingText = useMemo(() => {
    const map = typing[conversationId];
    if (!map) return null;
    const names = Object.values(map);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing…`;
    return `${names.length} people are typing…`;
  }, [typing, conversationId]);

  // The last non-deleted message I sent (for the read receipt).
  const myLastMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.sender.id === meId && !m.pending) return m.id;
    }
    return null;
  }, [messages, meId]);

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

  const other = otherParticipant(conversation, meId);

  return (
    <div className="grid h-full w-full grid-cols-9 gap-4">
      {/* ── CENTRAL THREAD ── */}
      <main className="col-span-9 flex h-full flex-col overflow-hidden xl:col-span-6">
        <Card className="flex flex-1 flex-col overflow-hidden border border-[--surface-secondary] bg-[--surface] shadow-sm">
          <ThreadHeader
            conversation={conversation}
            meId={meId}
            isOnline={isOnline}
            typingText={typingText}
            onRename={handleRename}
            onAddPeople={() => setAddPeopleOpen(true)}
            onLeave={handleLeave}
            onDelete={handleDeleteConversation}
            onOpenTheme={() => setThemeOpen(true)}
          />

          <div className="relative flex-1 overflow-hidden">
            {themed && (
              <>
                <div
                  className="pointer-events-none absolute inset-0 bg-[--surface]"
                  style={themeStyles.base}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={themeStyles.scrim}
                />
              </>
            )}
            <div
              ref={scrollRef}
              onScroll={onScroll}
              className="absolute inset-0 overflow-y-auto px-4 py-4 [scrollbar-width:thin]"
            >
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : allMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-[--muted]">
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs">Say hi to start the conversation.</p>
              </div>
            ) : (
              <>
                {loadingOlder && (
                  <div className="flex justify-center py-2">
                    <Spinner size="sm" />
                  </div>
                )}
                {allMessages.map((message, i) => {
                  const prev = allMessages[i - 1];
                  const isMe = message.sender.id === meId;
                  const grouped = shouldGroup(prev, message);
                  const showDivider =
                    !prev ||
                    new Date(prev.created_at).toDateString() !==
                      new Date(message.created_at).toDateString();

                  const isSeen =
                    isMe &&
                    message.id === myLastMessageId &&
                    otherLastReadAt !== null &&
                    otherLastReadAt >= new Date(message.created_at).getTime();

                  return (
                    <div key={message.id}>
                      {showDivider && (
                        <div className="my-3 flex items-center justify-center">
                          <span className="rounded-full bg-[--surface-secondary] px-3 py-0.5 text-[10px] font-medium text-[--muted]">
                            {formatDayDivider(message.created_at)}
                          </span>
                        </div>
                      )}
                      <MessageItem
                        message={message}
                        isMe={isMe}
                        isGroup={conversation.is_group}
                        showHeader={!grouped || showDivider}
                        meId={user?.id}
                        onReply={setReplyTo}
                        onEdit={setEditing}
                        onDelete={handleDelete}
                        onReact={handleReact}
                      />
                      {isSeen && (
                        <p className="mt-0.5 pr-1 text-right text-[10px] font-medium text-[--accent]">
                          Seen
                        </p>
                      )}
                    </div>
                  );
                })}
                <div ref={endRef} />
              </>
            )}
            </div>
          </div>

          <MessageInput
            onSend={handleSend}
            onTyping={handleTyping}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            editing={editing}
            onSaveEdit={async (content) => {
              if (editing) await edit(editing.id, content);
              setEditing(null);
            }}
            onCancelEdit={() => setEditing(null)}
            placeholder={
              conversation.is_group
                ? `Message ${conversation.display_name}`
                : `Message ${userDisplayName(other)}`
            }
          />
        </Card>
      </main>

      {/* ── RIGHT RAIL: DETAILS ── */}
      <aside className="col-span-3 hidden h-full flex-col overflow-hidden xl:flex">
        <div className="sticky top-0 space-y-3">
          <Card className="flex flex-col items-center border border-[--surface-secondary] bg-[--surface] p-4 text-center shadow-sm">
            <ChatAvatar
              name={
                conversation.is_group
                  ? conversation.display_name
                  : userDisplayName(other)
              }
              avatarUrl={
                conversation.is_group
                  ? conversation.image_url
                  : other?.avatar_url
              }
              isGroup={conversation.is_group}
              online={
                conversation.is_group ? undefined : isOnline(other?.id)
              }
              size="lg"
              className="mb-3"
            />
            <h3 className="text-sm font-bold text-[--foreground]">
              {conversation.is_group
                ? conversation.display_name
                : userDisplayName(other)}
            </h3>
            {!conversation.is_group && (
              <p className="mt-0.5 text-[11px] font-medium text-[--accent]">
                @{other?.username}
              </p>
            )}
            <p className="mt-2 rounded-full border border-[--surface-secondary] bg-[--surface-secondary] px-2.5 py-1 text-[10px] text-[--muted]">
              {conversation.is_group
                ? `${conversation.participants_detail?.length ?? 0} members`
                : isOnline(other?.id)
                  ? "Active now"
                  : "Offline"}
            </p>
          </Card>

          {conversation.is_group && (
            <Card className="border border-[--surface-secondary] bg-[--surface] p-3 shadow-sm">
              <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-wider text-[--muted]">
                Members
              </p>
              <div className="space-y-1.5">
                {conversation.participants_detail?.map((p) => (
                  <div key={p.user.id} className="flex items-center gap-2">
                    <ChatAvatar
                      name={userDisplayName(p.user)}
                      avatarUrl={p.user.avatar_url}
                      online={isOnline(p.user.id)}
                      size="sm"
                    />
                    <span className="flex-1 truncate text-xs text-[--foreground]">
                      {userDisplayName(p.user)}
                      {p.user.id === meId && " (you)"}
                    </span>
                    {p.is_admin && (
                      <span className="text-[9px] font-semibold text-[--accent]">
                        admin
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="flex flex-row items-start gap-3 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3.5 shadow-none">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                Stay safe
              </h4>
              <p className="mt-1 text-[10px] leading-normal text-[--muted]">
                Be respectful and follow campus community guidelines. Never
                share passwords or personal financial details.
              </p>
            </div>
          </Card>
        </div>
      </aside>

      <AddParticipantModal
        isOpen={addPeopleOpen}
        onOpenChange={setAddPeopleOpen}
        conversation={conversation}
        onAdded={() => void refresh()}
      />

      <ChatThemeModal
        conversationId={conversationId}
        isOpen={themeOpen}
        onOpenChange={setThemeOpen}
      />
    </div>
  );
}

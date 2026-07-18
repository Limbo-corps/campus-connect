"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Spinner, Accordion, Switch } from "@heroui/react";
import useSWR from "swr";
import {
  ShieldAlert,
  FileText,
  MessageCircle,
  GraduationCap,
  Bell,
  Users,
  Info,
  School,
  MapPin,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useCampuses } from "@/hooks/useCampuses";
import { useMessages, type LocalMessage } from "@/hooks/useMessages";
import * as chatApi from "@/lib/chat/api";
import { getUserByUsername } from "@/lib/users/api";
import { campusImage } from "@/lib/banners";
import CampusEmblem from "@/components/campus/CampusEmblem";
import {
  formatDayDivider,
  otherParticipant,
  shouldGroup,
  userDisplayName,
} from "@/lib/chat/format";
import type { ChatEvent, Conversation, ReadReceiptPayload } from "@/types";

import { ThreadHeader } from "@/components/chat/ThreadHeader";
import { MessageItem } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import AddParticipantModal from "@/components/chat/AddParticipantModal";
import type { SendInput } from "@/hooks/useMessages";
import { BOT_USER, isBotCommand, runBotCommand } from "@/lib/chat/bot";

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
    subscribe,
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
  const [otherLastReadAt, setOtherLastReadAt] = useState<number | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);

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
    return { ...otherBase, ...fullOtherProfile };
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

  useEffect(() => {
    if (!conversationId) return;

    return subscribe((event: ChatEvent) => {
      if (event.event !== "read.receipt") return;
      const data = event.data as ReadReceiptPayload;
      if (data.conversation !== conversationId || data.user_id === meId) return;

      const msg = messages.find((m) => m.id === data.last_read_message);
      if (msg) setOtherLastReadAt(new Date(msg.created_at).getTime());
    });
  }, [conversationId, subscribe, meId, messages]);

  useEffect(() => {
    if (loading) return;

    const grew = messages.length > prevLenRef.current;
    const last = messages[messages.length - 1];
    const isMine = last?.sender.id === meId;
    const el = scrollRef.current;

    const nearBottom = el
      ? el.scrollHeight - el.scrollTop - el.clientHeight < 200
      : true;

    if (grew && (isMine || nearBottom || prevLenRef.current === 0)) {
      endRef.current?.scrollIntoView({
        behavior: prevLenRef.current === 0 ? "auto" : "smooth",
      });
    }
    prevLenRef.current = messages.length;
  }, [messages, loading, meId]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el && el.scrollTop < 60 && hasMore && !loadingOlder) {
      const prevHeight = el.scrollHeight;
      void loadOlder().then(() => {
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

  const derivedOtherLastReadAt = useMemo(() => {
    if (!conversation || messages.length === 0) return null;

    const others =
      conversation.participants_detail?.filter((p) => p.user.id !== meId) || [];
    const readIds = others
      .map((p) => p.last_read_message)
      .filter(Boolean) as string[];
    if (readIds.length === 0) return null;

    const targetTimes = messages
      .filter((m) => readIds.includes(m.id))
      .map((m) => new Date(m.created_at).getTime());

    return targetTimes.length ? Math.max(...targetTimes) : null;
  }, [conversation, messages, meId]);

  const effectiveOtherLastReadAt = otherLastReadAt ?? derivedOtherLastReadAt;

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

  const otherIsOnline = checkUserOnlineStatus(other?.id);

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
          />

          <div className="relative flex-1 overflow-hidden">
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
                      effectiveOtherLastReadAt !== null &&
                      effectiveOtherLastReadAt >= new Date(message.created_at).getTime();

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
                          <p className="mt-0.5 pr-1 text-right text-[10px] font-medium text-[--accent] animate-in fade-in-50 duration-200">
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

      {/* ── RIGHT RAIL: ACCORDION LAYOUT ── */}
      <aside className="col-span-3 hidden h-full flex-col overflow-y-auto pr-1 [scrollbar-width:thin] xl:flex">
        <div className="space-y-3">
          {/* Main Context Card */}
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
              online={conversation.is_group ? undefined : otherIsOnline}
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
                @{other?.username || "username"}
              </p>
            )}

            {!conversation.is_group && (
              <div className="mt-2 flex items-center gap-1 bg-[--surface-secondary] px-2 py-0.5 text-[11px] rounded text-[--foreground]">
                <MessageCircle size={12} className="text-[--accent]" />
                <span className="truncate max-w-[180px]">
                  {other?.tagline || "No status set"}
                </span>
              </div>
            )}

            <p className="mt-2.5 rounded-full border border-[--surface-secondary] bg-[--surface-secondary] px-2.5 py-1 text-[10px] text-[--muted]">
              {conversation.is_group
                ? `${conversation.participants_detail?.length ?? 0} members`
                : otherIsOnline
                  ? "Active now"
                  : "Offline"}
            </p>
          </Card>

          {/* Interactive Accordion Blocks */}
          <Accordion variant="default" hideSeparator className="px-0">
            {/* 1. About / Details Section */}
            {!conversation.is_group ? (
              <Accordion.Item id="details">
                <Accordion.Heading>
                  <Accordion.Trigger className="rounded-lg border border-[--surface-secondary] bg-[--surface] px-3 py-2 text-xs font-bold text-[--foreground]">
                    <span className="flex items-center gap-2">
                      <Info size={16} className="text-[--muted]" />
                      User Info
                    </span>
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body>
                    <div className="pb-3 text-left space-y-3">

                      <div className="flex items-start gap-2 border-t border-[--surface-secondary]/50 pt-2">
                        <FileText
                          size={14}
                          className="mt-0.5 shrink-0 text-[--muted]"
                        />
                        <div className="w-full min-w-0">
                          <span className="block text-[9px] uppercase font-bold tracking-wider text-[--muted]">
                            About Me
                          </span>
                          <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-[--foreground]">
                            {other?.bio || "Hi! I am new here."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ) : (
              <Accordion.Item id="members">
                <Accordion.Heading>
                  <Accordion.Trigger className="rounded-lg border border-[--surface-secondary] bg-[--surface] px-3 py-2 text-xs font-bold text-[--foreground]">
                    <span className="flex items-center gap-2">
                      <Users size={16} className="text-[--muted]" />
                      Group Members
                    </span>
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body>
                    <div className="max-h-48 space-y-2 overflow-y-auto pb-2 pr-1 [scrollbar-width:thin]">
                      {conversation.participants_detail?.map((p) => (
                        <div key={p.user.id} className="flex items-center gap-2">
                          <ChatAvatar
                            name={userDisplayName(p.user)}
                            avatarUrl={p.user.avatar_url}
                            online={checkUserOnlineStatus(p.user.id)}
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
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* 2. Active Campus Accordion Block */}
            {activeCampus && (
              <Accordion.Item id="campus">
                <Accordion.Heading>
                  <Accordion.Trigger className="rounded-lg border border-[--surface-secondary] bg-[--surface] px-3 py-2 text-xs font-bold text-[--foreground]">
                    <span className="flex items-center gap-2">
                      <School size={16} className="text-[--muted]" />
                      Active Campus
                    </span>
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body>
                    <div className="space-y-3 pb-3 text-left">
                      <div
                        className="h-14 rounded-lg border border-[--surface-secondary] bg-cover bg-center"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url('${activeCampus.banner_url || campusImage(activeCampus.name)}')`,
                        }}
                      />

                      <div className="flex items-center gap-2.5">
                        <CampusEmblem
                          campus={activeCampus}
                          className="size-9 shrink-0 rounded-md border border-[--surface-secondary] shadow-sm"
                          textClassName="text-xs"
                        />
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-[--foreground]">
                            {activeCampus.name}
                          </span>
                          {(activeCampus.city || activeCampus.state) && (
                            <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[--muted]">
                              <MapPin size={10} />
                              {[activeCampus.city, activeCampus.state]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {activeCampus.description && (
                        <p className="line-clamp-3 border-t border-[--surface-secondary]/50 pt-2 text-xs leading-relaxed text-[--foreground]">
                          {activeCampus.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 rounded-md bg-[--surface-secondary]/50 p-2 text-[10px] text-[--muted]">
                        <Users size={12} className="text-[--accent]" />
                        <span>
                          <strong>
                            {activeCampus.students_count?.toLocaleString() ?? 0}
                          </strong>{" "}
                          registered students here
                        </span>
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* 3. Preferences / Control Toggles Section */}
            <Accordion.Item id="preferences">
              <Accordion.Heading>
                <Accordion.Trigger className="rounded-lg border border-[--surface-secondary] bg-[--surface] px-3 py-2 text-xs font-bold text-[--foreground]">
                  <span className="flex items-center gap-2">
                    <Bell size={16} className="text-[--muted]" />
                    Chat Controls
                  </span>
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>
                  <div className="space-y-3 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-medium text-[--foreground]">
                          Mute Notifications
                        </span>
                        <span className="text-[10px] text-[--muted]">
                          Silence highlights and alerts
                        </span>
                      </div>
                      <Switch
                        size="sm"
                        isSelected={isMuted}
                        onChange={(selected: boolean) => setIsMuted(selected)}
                      >
                        <Switch.Content>
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                        </Switch.Content>
                      </Switch>
                    </div>

                    {!conversation.is_group && (
                      <div className="flex items-center justify-between gap-2 border-t border-[--surface-secondary]/50 pt-3">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-medium text-danger">
                            Block User
                          </span>
                          <span className="text-[10px] text-[--muted]">
                            Prevent direct communication
                          </span>
                        </div>
                        <Switch
                          size="sm"
                          isSelected={isBlocked}
                          onChange={(selected: boolean) => setIsBlocked(selected)}
                        >
                          <Switch.Content>
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                          </Switch.Content>
                        </Switch>
                      </div>
                    )}
                  </div>
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

          {/* Guidelines Banner */}
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
    </div>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ChatSocket } from "@/lib/chat/socket";
import * as chatApi from "@/lib/chat/api";
import type {
  ChatEvent,
  Conversation,
  Message,
  PresencePayload,
  ReadReceiptPayload,
  TypingPayload,
} from "@/types/chat";

type TypingState = Record<string, Record<string, string>>; // conversationId -> userId -> username

interface ChatContextValue {
  conversations: Conversation[];
  loading: boolean;
  connected: boolean;
  totalUnread: number;
  onlineUserIds: Set<string>;
  typing: TypingState;
  isOnline(userId: string | null | undefined): boolean;
  refresh(): Promise<void>;
  setActiveConversation(id: string | null): void;
  markRead(conversationId: string, messageId?: string): Promise<void>;
  sendTyping(conversationId: string, isTyping: boolean): void;
  upsertConversation(conversation: Conversation): void;
  removeConversation(id: string): void;
  /** Subscribe to raw socket events. Returns an unsubscribe fn. */
  subscribe(fn: (event: ChatEvent) => void): () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const meId = user?.id ?? null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState<TypingState>({});

  const socketRef = useRef<ChatSocket | null>(null);
  const activeConversationRef = useRef<string | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const listenersRef = useRef<Set<(event: ChatEvent) => void>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(sortConversations(data));
    } catch {
      // Leave the existing list in place on transient failures.
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const without = prev.filter((c) => c.id !== conversation.id);
      return sortConversations([conversation, ...without]);
    });
  }, []);

  const removeConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const markRead = useCallback(
    async (conversationId: string, messageId?: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c,
        ),
      );
      try {
        await chatApi.markRead(conversationId, messageId);
      } catch {
        // Non-fatal; the next refresh will reconcile.
      }
    },
    [],
  );

  const setActiveConversation = useCallback((id: string | null) => {
    activeConversationRef.current = id;
    if (id) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
      );
    }
  }, []);

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      socketRef.current?.sendTyping(conversationId, isTyping);
    },
    [],
  );

  const emitEvent = useCallback((event: ChatEvent) => {
    listenersRef.current.forEach((fn) => fn(event));
  }, []);

  // ── incoming-event reducers ───────────────────────────────────────────────
  const applyMessageNew = useCallback(
    (message: Message) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === message.conversation);
        if (idx === -1) {
          void refresh();
          return prev;
        }
        const existing = prev[idx];
        const isActive = activeConversationRef.current === message.conversation;
        const fromMe = message.sender.id === meId;
        const nextUnread =
          isActive || fromMe ? 0 : (existing.unread_count ?? 0) + 1;

        const updated: Conversation = {
          ...existing,
          last_message: message,
          unread_count: nextUnread,
          updated_at: message.created_at,
        };
        const without = prev.filter((c) => c.id !== message.conversation);
        return sortConversations([updated, ...without]);
      });

      if (
        activeConversationRef.current === message.conversation &&
        message.sender.id !== meId
      ) {
        void chatApi.markRead(message.conversation, message.id).catch(() => {});
      }
    },
    [meId, refresh],
  );

  const applyMessageUpdate = useCallback((updatedMessage: Message) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (
          c.id === updatedMessage.conversation &&
          c.last_message?.id === updatedMessage.id
        ) {
          return { ...c, last_message: updatedMessage };
        }
        return c;
      }),
    );
  }, []);

  const applyConversationUpdated = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === conversation.id);
      const merged: Conversation = existing
        ? { ...conversation, unread_count: existing.unread_count }
        : conversation;
      const without = prev.filter((c) => c.id !== conversation.id);
      return sortConversations([merged, ...without]);
    });
  }, []);

  const applyReadReceipt = useCallback((payload: ReadReceiptPayload) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== payload.conversation_id) return c;
        return {
          ...c,
          participants_detail: c.participants_detail.map((p) =>
            p.user.id === payload.user_id
              ? {
                  ...p,
                  last_read_message: payload.last_read_message,
                  last_read_at: payload.last_read_at,
                }
              : p,
          ),
        };
      }),
    );
  }, []);

  const clearTyping = useCallback((conversationId: string, userId: string) => {
    setTyping((prev) => {
      const conv = prev[conversationId];
      if (!conv || !(userId in conv)) return prev;
      const nextConv = { ...conv };
      delete nextConv[userId];
      return { ...prev, [conversationId]: nextConv };
    });
  }, []);

  const applyTyping = useCallback(
    (payload: TypingPayload) => {
      if (payload.user_id === meId) return;
      const timerKey = `${payload.conversation}:${payload.user_id}`;
      const existingTimer = typingTimers.current[timerKey];
      if (existingTimer) clearTimeout(existingTimer);

      if (payload.is_typing) {
        setTyping((prev) => ({
          ...prev,
          [payload.conversation]: {
            ...(prev[payload.conversation] ?? {}),
            [payload.user_id]: payload.username,
          },
        }));
        typingTimers.current[timerKey] = setTimeout(
          () => clearTyping(payload.conversation, payload.user_id),
          6000,
        );
      } else {
        clearTyping(payload.conversation, payload.user_id);
      }
    },
    [meId, clearTyping],
  );

  // ── Create mutable handlers object to keep effect dependency clean ─────
  const eventHandlersRef = useRef({
    emitEvent,
    applyMessageNew,
    applyMessageUpdate,
    applyConversationUpdated,
    removeConversation,
    refresh,
    applyReadReceipt,
    applyTyping,
  });

  // Keep references completely fresh on every render pass
  useEffect(() => {
    eventHandlersRef.current = {
      emitEvent,
      applyMessageNew,
      applyMessageUpdate,
      applyConversationUpdated,
      removeConversation,
      refresh,
      applyReadReceipt,
      applyTyping,
    };
  });

  // ── socket lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    if (!meId) {
      socketRef.current?.close();
      socketRef.current = null;

      queueMicrotask(() => {
        setConversations([]);
        setConnected(false);
        setOnlineUserIds(new Set());
        setLoading(true);
      });
      return;
    }

    // Schedule refresh asynchronously to avoid calling setState synchronously
    // inside an effect (react warns about cascading renders). Use
    // queueMicrotask when available for a microtask-scheduled update.
    if (typeof queueMicrotask !== "undefined") {
      queueMicrotask(() => {
        void refresh();
      });
    } else {
      // Fallback to a macrotask if queueMicrotask isn't present.
      setTimeout(() => {
        void refresh();
      }, 0);
    }

    const socket = new ChatSocket(() =>
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null,
    );
    socketRef.current = socket;

    const offStatus = socket.onStatus(setConnected);

    // Subscribe using the stable tracking ref object
    const offEvents = socket.subscribe((event: ChatEvent) => {
      const handlers = eventHandlersRef.current;
      handlers.emitEvent(event);

      switch (event.event) {
        case "message.created":
          handlers.applyMessageNew(event.data as Message);
          break;
        case "message.updated":
        case "message.deleted":
        case "reaction.updated":
          handlers.applyMessageUpdate(event.data as Message);
          break;
        case "conversation.created":
        case "conversation.updated":
          handlers.applyConversationUpdated(event.data as Conversation);
          break;
        case "conversation.deleted":
          handlers.removeConversation(
            (event.data as { conversation_id: string }).conversation_id,
          );
          break;
        case "participant.joined":
        case "participant.left": {
          const data = event.data as {
            conversation: string;
            user: { id: string };
          };
          if (event.event === "participant.left" && data.user.id === meId) {
            handlers.removeConversation(data.conversation);
          } else {
            void handlers.refresh();
          }
          break;
        }
        case "read_receipt.updated":
          handlers.applyReadReceipt(event.data as ReadReceiptPayload);
          break;
        case "presence.snapshot":
          setOnlineUserIds(
            new Set((event.data as { online: string[] }).online),
          );
          break;
        case "presence.updated": {
          const { user_id, is_online } = event.data as PresencePayload;
          setOnlineUserIds((prev) => {
            const next = new Set(prev);
            if (is_online) next.add(user_id);
            else next.delete(user_id);
            return next;
          });
          break;
        }
        case "typing.started":
        case "typing.stopped":
          handlers.applyTyping(event.data as TypingPayload);
          break;
        default:
          break;
      }
    });

    socket.connect();

    const timers = typingTimers.current;
    return () => {
      offStatus();
      offEvents();
      socket.close();
      Object.values(timers).forEach(clearTimeout);
    };
  }, [meId, refresh]);

  const subscribe = useCallback((fn: (event: ChatEvent) => void) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  const isOnline = useCallback(
    (userId: string | null | undefined) =>
      userId != null && onlineUserIds.has(userId),
    [onlineUserIds],
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0),
    [conversations],
  );

  const value: ChatContextValue = {
    conversations,
    loading,
    connected,
    totalUnread,
    onlineUserIds,
    typing,
    isOnline,
    refresh,
    setActiveConversation,
    markRead,
    sendTyping,
    upsertConversation,
    removeConversation,
    subscribe,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}

export type { ReadReceiptPayload };

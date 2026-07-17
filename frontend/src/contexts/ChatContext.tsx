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
} from "@/types";

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
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
      // Optimistically clear the local unread badge.
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

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    socketRef.current?.sendTyping(conversationId, isTyping);
  }, []);

  // ── incoming-event reducers ───────────────────────────────────────────────
  const applyMessageNew = useCallback(
    (message: Message) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === message.conversation);
        if (idx === -1) {
          // Conversation not in the list yet (e.g. first message of a brand new
          // thread from someone else) — pull a fresh list.
          void refresh();
          return prev;
        }
        const existing = prev[idx];
        const isActive =
          activeConversationRef.current === message.conversation;
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

      // If the message landed in the conversation we're viewing, mark it read.
      if (
        activeConversationRef.current === message.conversation &&
        message.sender.id !== meId
      ) {
        void chatApi.markRead(message.conversation, message.id).catch(() => {});
      }
    },
    [meId, refresh],
  );

  const applyConversationUpdated = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === conversation.id);
      // Preserve our locally-tracked unread count: the broadcast payload's
      // unread_count is computed for whoever triggered the update, not us.
      const merged: Conversation = existing
        ? { ...conversation, unread_count: existing.unread_count }
        : conversation;
      const without = prev.filter((c) => c.id !== conversation.id);
      return sortConversations([merged, ...without]);
    });
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
        // Auto-expire in case a "stopped typing" event is missed.
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

  // ── socket lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    if (!meId) {
      // Signed out — tear down.
      socketRef.current?.close();
      socketRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting on sign-out
      setConversations([]);
      setConnected(false);
      setOnlineUserIds(new Set());
      setLoading(true);
      return;
    }

    void refresh();

    const socket = new ChatSocket(() =>
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null,
    );
    socketRef.current = socket;

    const offStatus = socket.onStatus(setConnected);
    const offEvents = socket.subscribe((event: ChatEvent) => {
      switch (event.event) {
        case "message.new":
          applyMessageNew(event.data as Message);
          break;
        case "conversation.created":
          applyConversationUpdated(event.data as Conversation);
          break;
        case "conversation.updated":
          applyConversationUpdated(event.data as Conversation);
          break;
        case "conversation.deleted":
          removeConversation((event.data as { id: string }).id);
          break;
        case "participant.added":
        case "participant.removed": {
          const data = event.data as { conversation: string; user: { id: string } };
          if (event.event === "participant.removed" && data.user.id === meId) {
            removeConversation(data.conversation);
          } else {
            void refresh();
          }
          break;
        }
        case "presence.snapshot":
          setOnlineUserIds(
            new Set((event.data as { online: string[] }).online),
          );
          break;
        case "presence.update": {
          const { user_id, is_online } = event.data as PresencePayload;
          setOnlineUserIds((prev) => {
            const next = new Set(prev);
            if (is_online) next.add(user_id);
            else next.delete(user_id);
            return next;
          });
          break;
        }
        case "typing":
          applyTyping(event.data as TypingPayload);
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
  }, [
    meId,
    refresh,
    applyMessageNew,
    applyConversationUpdated,
    applyTyping,
    removeConversation,
  ]);

  const subscribe = useCallback(
    (fn: (event: ChatEvent) => void) =>
      socketRef.current?.subscribe(fn) ?? (() => {}),
    [],
  );

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

// Re-export for consumers that only need the read-receipt payload type.
export type { ReadReceiptPayload };

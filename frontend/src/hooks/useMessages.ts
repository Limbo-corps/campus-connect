// @/hooks/useMessages.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import * as chatApi from "@/lib/chat/api";
import type { ChatEvent, Message, MessageType, ReactionGroup } from "@/types";

/** A message plus client-only optimistic-send flags. */
export type LocalMessage = Message & {
  pending?: boolean;
  failed?: boolean;
  /** CampusBot / slash-command message (rendered with a BOT badge). */
  bot?: boolean;
  /** Local-only message not persisted to the backend (e.g. bot replies). */
  ephemeral?: boolean;
};

const PAGE_SIZE = 30;

function inferType(file: File): MessageType {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  if (file.type.startsWith("audio/")) return "AUDIO";
  return "FILE";
}

function upsert(list: LocalMessage[], message: LocalMessage): LocalMessage[] {
  const idx = list.findIndex((m) => m.id === message.id);
  if (idx === -1) {
    return [...list, message];
  }
  const next = [...list];
  next[idx] = { ...next[idx], ...message };
  return next;
}

export interface SendInput {
  content?: string;
  attachment?: File | null;
  replyTo?: string | null;
}

/**
 * Loads and maintains the message list for a single conversation, keeping it
 * in sync with live WebSocket events (new / edited / deleted messages) and
 * exposing optimistic send / edit / delete plus older-message pagination.
 */
export function useMessages(conversationId: string | null) {
  const { subscribe } = useChat();
  const { user } = useAuth();

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Guards against a stale response overwriting a newer conversation's data.
  const requestIdRef = useRef(0);

  // Initial load (and reload when the conversation changes).
  useEffect(() => {
    if (!conversationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a null conversation
      setMessages([]);
      setLoading(false);
      setHasMore(false);
      return;
    }

    const reqId = ++requestIdRef.current;
    setLoading(true);
    setMessages([]);

    chatApi
      .getMessages(conversationId, { limit: PAGE_SIZE })
      .then((page) => {
        if (requestIdRef.current !== reqId) return;
        setMessages(page.results);
        setHasMore(page.has_more);
      })
      .catch(() => {
        if (requestIdRef.current !== reqId) return;
        setMessages([]);
      })
      .finally(() => {
        if (requestIdRef.current === reqId) setLoading(false);
      });
  }, [conversationId]);

  // Live event subscription for this conversation.
  useEffect(() => {
    if (!conversationId) return;

    const off = subscribe((event: ChatEvent) => {
      switch (event.event) {
        case "message.new": {
          const msg = event.data as Message;
          if (msg.conversation !== conversationId) return;
          setMessages((prev) => {
            // Reconcile an optimistic message from this sender, if present.
            if (msg.sender.id === user?.id) {
              const pendingIdx = prev.findIndex(
                (m) =>
                  m.pending &&
                  m.content === msg.content &&
                  m.sender.id === msg.sender.id,
              );
              if (pendingIdx !== -1) {
                const next = [...prev];
                next[pendingIdx] = msg;
                return next;
              }
            }
            return upsert(prev, msg);
          });
          break;
        }
        case "message.edited":
        case "message.deleted":
        case "message.reaction": {
          const msg = event.data as Message;
          if (msg.conversation !== conversationId) return;
          setMessages((prev) => upsert(prev, msg));
          break;
        }
        default:
          break;
      }
    });

    return off;
  }, [conversationId, subscribe, user?.id]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || loadingOlder || !hasMore) return;
    const oldest = messages.find((m) => !m.pending);
    if (!oldest) return;

    setLoadingOlder(true);
    try {
      const page = await chatApi.getMessages(conversationId, {
        before: oldest.id,
        limit: PAGE_SIZE,
      });
      setMessages((prev) => [...page.results, ...prev]);
      setHasMore(page.has_more);
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, hasMore, loadingOlder, messages]);

  const send = useCallback(
    async (input: SendInput) => {
      if (!conversationId || !user) return;
      const trimmed = (input.content ?? "").trim();
      if (!trimmed && !input.attachment) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const type: MessageType = input.attachment
        ? inferType(input.attachment)
        : "TEXT";

      const optimistic: LocalMessage = {
        id: tempId,
        conversation: conversationId,
        sender: {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
        },
        type,
        content: trimmed,
        attachment_url:
          input.attachment && type === "IMAGE"
            ? URL.createObjectURL(input.attachment)
            : null,
        reply_to: null,
        edited_at: null,
        deleted_at: null,
        is_deleted: false,
        is_edited: false,
        reactions: [],
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const real = await chatApi.sendMessage(conversationId, {
          content: trimmed,
          attachment: input.attachment,
          replyTo: input.replyTo,
          type,
        });
        // Replace the optimistic entry; the WS echo (if any) is idempotent.
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId);
          return upsert(withoutTemp, real);
        });
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, pending: false, failed: true } : m,
          ),
        );
      }
    },
    [conversationId, user],
  );

  const edit = useCallback(async (messageId: string, content: string) => {
    const updated = await chatApi.editMessage(messageId, content);
    setMessages((prev) => upsert(prev, updated));
  }, []);

  const remove = useCallback(async (messageId: string) => {
    const updated = await chatApi.deleteMessage(messageId);
    setMessages((prev) => upsert(prev, updated));
  }, []);

  const react = useCallback(
    async (messageId: string, emoji: string) => {
      const myId = user?.id;
      if (!myId) return;
      // Optimistically toggle the reaction so it feels instant.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: toggleReaction(m.reactions, emoji, myId) }
            : m,
        ),
      );
      try {
        const updated = await chatApi.reactToMessage(messageId, emoji);
        setMessages((prev) => upsert(prev, updated));
      } catch {
        // Roll back on failure by toggling again.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, reactions: toggleReaction(m.reactions, emoji, myId) }
              : m,
          ),
        );
      }
    },
    [user?.id],
  );

  return {
    messages,
    loading,
    hasMore,
    loadingOlder,
    loadOlder,
    send,
    edit,
    remove,
    react,
  };
}

/** Optimistically add/remove the current user's reaction for an emoji. */
function toggleReaction(
  reactions: ReactionGroup[],
  emoji: string,
  myId: string,
): ReactionGroup[] {
  const existing = reactions.find((r) => r.emoji === emoji);
  if (!existing) {
    return [...reactions, { emoji, count: 1, user_ids: [myId] }];
  }
  if (existing.user_ids.includes(myId)) {
    // Remove my reaction; drop the group entirely if it becomes empty.
    const user_ids = existing.user_ids.filter((id) => id !== myId);
    if (user_ids.length === 0) return reactions.filter((r) => r.emoji !== emoji);
    return reactions.map((r) =>
      r.emoji === emoji ? { ...r, count: user_ids.length, user_ids } : r,
    );
  }
  const user_ids = [...existing.user_ids, myId];
  return reactions.map((r) =>
    r.emoji === emoji ? { ...r, count: user_ids.length, user_ids } : r,
  );
}

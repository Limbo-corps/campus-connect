// components/chat/ChatListItem.tsx
"use client";

import React from "react";
import Link from "next/link";

import { ChatAvatar } from "./ChatAvatar";
import {
  formatListTime,
  messagePreview,
  otherParticipant,
  userDisplayName,
} from "@/lib/chat/format";
import type { Conversation, PresencePayload } from "@/types";

interface ChatListItemProps {
  conversation: Conversation;
  active: boolean;
  meId: string | null;
  getPresence: (
    userId: string | null | undefined,
  ) => PresencePayload | undefined;
  onNavigate?: () => void;
}

export function ChatListItem({
  conversation,
  active,
  meId,
  getPresence,
  onNavigate,
}: ChatListItemProps) {
  const isGroup = conversation.is_group;
  const other = otherParticipant(conversation, meId);
  const presence = !isGroup ? getPresence(other?.id) : undefined;

  const unread = conversation.unread_count ?? 0;
  const hasUnread = unread > 0 && !active;

  const name = isGroup
    ? conversation.display_name || "Group chat"
    : userDisplayName(other);

  const preview = messagePreview(conversation.last_message);
  const previewPrefix =
    conversation.last_message?.sender.id === meId ? "You: " : "";

  return (
    <Link
      href={`/chat/${conversation.id}`}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
        active
          ? "border-[--accent]/20 bg-[--accent]/10 text-[--foreground] shadow-xs"
          : "border-transparent bg-transparent text-[--foreground]/80 hover:bg-[--surface-secondary]/40"
      }`}
    >
      <ChatAvatar
        name={name}
        avatarUrl={isGroup ? conversation.image_url : other?.avatar_url}
        isGroup={isGroup}
        presence={presence}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <p
            className={`truncate text-xs ${
              hasUnread ? "font-bold text-[--foreground]" : "font-semibold"
            }`}
          >
            {name}
          </p>
          {conversation.last_message && (
            <span className="shrink-0 text-[9px] text-[--muted]">
              {formatListTime(conversation.updated_at)}
            </span>
          )}
        </div>
        <p
          className={`mt-0.5 truncate text-[11px] ${
            hasUnread ? "font-medium text-[--foreground]" : "text-[--muted]"
          }`}
        >
          {previewPrefix}
          {preview}
        </p>
      </div>

      {hasUnread && (
        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-md bg-[--accent] px-1 text-[9px] font-bold text-[--accent-foreground] shadow-xs">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}

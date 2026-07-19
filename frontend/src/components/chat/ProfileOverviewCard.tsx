"use client";

import { Card } from "@heroui/react";
import { MessageCircle } from "lucide-react";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { userDisplayName } from "@/lib/chat/format";
import type { Conversation, ChatUser } from "@/types";

export function ProfileOverviewCard({
  conversation,
  other,
  otherIsOnline,
}: {
  conversation: Conversation;
  other: ChatUser | null;
  otherIsOnline: boolean;
}) {
  const name = conversation.is_group
    ? conversation.display_name
    : userDisplayName(other);
  const avatarUrl = conversation.is_group
    ? conversation.image_url
    : other?.avatar_url;

  return (
    <Card className="flex flex-col items-center border border-[--surface-secondary] bg-[--surface] p-4 text-center shadow-sm">
      <ChatAvatar
        name={name}
        avatarUrl={avatarUrl}
        isGroup={conversation.is_group}
        online={conversation.is_group ? undefined : otherIsOnline}
        size="lg"
        className="mb-3"
      />
      <h3 className="text-sm font-bold text-[--foreground]">{name}</h3>

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
  );
}

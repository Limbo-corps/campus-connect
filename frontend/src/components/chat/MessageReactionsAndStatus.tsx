"use client";

import React from "react";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { Tooltip, Button } from "@heroui/react";
import type { LocalMessage } from "@/hooks/useMessages";
import type { Participant } from "@/types/chat";
import { SeenByStack } from "./SeenByStack";

interface ReactionUser {
  id: string;
  name: string;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  user_ids: string[];
  users?: ReactionUser[];
}

interface MessageReactionsAndStatusProps {
  message: LocalMessage;
  isMe: boolean;
  isGroup?: boolean;
  meId?: string;
  isSeen: boolean;
  /** Group only: participants whose read-cursor is this message. */
  readers?: Participant[];
  deleted: boolean;
  canReact: boolean;
  onReact?: (message: LocalMessage, emoji: string) => void;
}

export const MessageReactionsAndStatus: React.FC<
  MessageReactionsAndStatusProps
> = ({
  message,
  isMe,
  isGroup,
  meId,
  isSeen,
  readers = [],
  deleted,
  canReact,
  onReact,
}) => {
  const reactions = (message.reactions as ReactionGroup[]) ?? [];
  const hasReaders = isGroup && readers.length > 0;

  if (
    reactions.length === 0 &&
    !message.is_edited &&
    !isMe &&
    !hasReaders
  ) {
    return null;
  }

  const getTooltipContent = (reaction: ReactionGroup) => {
    // 1. Resolve names array (Discord prioritized format)
    let names: string[] = [];

    if (reaction.users && reaction.users.length > 0) {
      names = reaction.users.map((u) => (u.id === meId ? "You" : u.name));
    } else if (reaction.user_ids && reaction.user_ids.length > 0) {
      names = reaction.user_ids.map((id) => (id === meId ? "You" : "Unknown"));
    }

    // Fallback if no user list is provided
    if (names.length === 0) {
      return `${reaction.count} person${reaction.count > 1 ? "s" : ""}`;
    }

    const totalCount = Math.max(reaction.count, names.length);

    // Show at most 3 usernames
    if (totalCount <= 3) {
      if (names.length === 1) return names[0];
      if (names.length === 2) return `${names[0]} and ${names[1]}`;
      return `${names[0]}, ${names[1]}, and ${names[2]}`;
    }

    // More than 3 reactions: "Name1, Name2, Name3 and X more"
    const shownNames = names.slice(0, 3).join(", ");
    const remainingCount = totalCount - 3;

    return `${shownNames} and ${remainingCount} more`;
  };

  return (
    <div className="flex items-center justify-between gap-2 mt-1.5">
      {reactions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reactions.map((r) => {
            const reacted = !!meId && r.user_ids.includes(meId);
            const tooltipText = getTooltipContent(r);

            return (
              <Tooltip key={r.emoji} delay={200} closeDelay={0}>
                <Tooltip.Trigger>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => canReact && onReact?.(message, r.emoji)}
                    isDisabled={!canReact}
                    className={`flex items-center gap-1.5 border px-2.5 py-1 min-w-0 h-auto text-xs font-medium rounded-full transition-all active:scale-95 select-none ${
                      reacted
                        ? "border-(--accent)/50 bg-(--accent)/15 text-(--foreground) shadow-sm"
                        : "border-white/10 bg-(--surface-secondary)/50 text-(--muted) hover:bg-(--surface-secondary) hover:text-(--foreground)"
                    }`}
                  >
                    <span>{r.emoji}</span>
                    <span className="font-semibold text-[11px]">{r.count}</span>
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content
                  placement="top"
                  className="bg-(--surface) border border-(--border) text-(--foreground) text-xs px-2 py-1 rounded-md shadow-xl backdrop-blur-md max-w-xs"
                >
                  <Tooltip.Arrow />
                  {tooltipText}
                </Tooltip.Content>
              </Tooltip>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-(--muted) ml-auto select-none">
        {message.is_edited && !deleted && <span>(edited)</span>}

        {/* Direct messages: cumulative delivered (✓) / seen (✓✓) ticks. */}
        {isMe &&
          !isGroup &&
          !message.pending &&
          !message.failed &&
          !deleted && (
            <span
              className="inline-flex items-center text-(--accent)"
              title={isSeen ? "Seen" : "Delivered"}
            >
              {isSeen ? (
                <CheckCheck size={13} className="stroke-[2.5]" />
              ) : (
                <Check size={13} className="stroke-[2.5]" />
              )}
            </span>
          )}

        {/* Group conversations: avatars of who has read up to this message. */}
        {hasReaders && !message.pending && !message.failed && !deleted && (
          <SeenByStack readers={readers} />
        )}

        {message.pending && (
          <Clock size={10} className="animate-pulse text-(--accent)" />
        )}

        {message.failed && (
          <span className="flex items-center gap-0.5 text-danger font-semibold">
            <AlertCircle size={10} /> Failed
          </span>
        )}
      </div>
    </div>
  );
};

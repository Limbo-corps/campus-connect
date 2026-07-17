// components/chat/MessageItem.tsx
"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Clock,
  CornerUpLeft,
  Pencil,
  SmilePlus,
  Trash2,
} from "lucide-react";

import { ChatAvatar } from "./ChatAvatar";
import { formatTime, userDisplayName } from "@/lib/chat/format";
import { isEmojiOnly } from "@/lib/chat/emoji";
import type { LocalMessage } from "@/hooks/useMessages";

/** Discord-style quick reactions offered in the picker. */
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface MessageItemProps {
  message: LocalMessage;
  isMe: boolean;
  isGroup: boolean;
  showHeader: boolean;
  /** Current user's id — used to highlight reactions they've made. */
  meId?: string;
  onReply?: (message: LocalMessage) => void;
  onEdit?: (message: LocalMessage) => void;
  onDelete?: (message: LocalMessage) => void;
  onReact?: (message: LocalMessage, emoji: string) => void;
}

export function MessageItem({
  message,
  isMe,
  isGroup,
  showHeader,
  meId,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: MessageItemProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const deleted = message.is_deleted;
  const isBot = !!message.bot;
  const jumbo =
    !deleted &&
    message.type === "TEXT" &&
    !message.attachment_url &&
    isEmojiOnly(message.content);
  const canEdit = isMe && !deleted && !isBot && message.type === "TEXT" && !jumbo;
  const canModify = isMe && !deleted && !isBot;
  const canReact = !!onReact && !deleted && !isBot && !message.pending;
  const reactions = message.reactions ?? [];

  const handleReact = (emoji: string) => {
    onReact?.(message, emoji);
    setPickerOpen(false);
  };

  const bubbleBase =
    "relative max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words";
  const bubbleTone = isMe
    ? "bg-[--accent] text-[--accent-foreground]"
    : "bg-[--surface-secondary] text-[--foreground]";

  return (
    <div
      className={`group flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${
        showHeader ? "mt-3" : "mt-0.5"
      }`}
    >
      {/* Avatar gutter (kept for others so bubbles align when grouped) */}
      {!isMe &&
        (showHeader ? (
          <ChatAvatar
            name={userDisplayName(message.sender)}
            avatarUrl={message.sender.avatar_url}
            size="sm"
          />
        ) : (
          <span className="w-8 shrink-0" />
        ))}

      <div className={`flex min-w-0 flex-col ${isMe ? "items-end" : "items-start"}`}>
        {showHeader && !isMe && (isGroup || isBot) && (
          <span className="mb-0.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold text-[--accent]">
            {userDisplayName(message.sender)}
            {isBot && (
              <span className="rounded bg-[--accent] px-1 py-px text-[9px] font-bold uppercase leading-none text-[--accent-foreground]">
                Bot
              </span>
            )}
          </span>
        )}

        <div className="flex items-end gap-1.5">
          {/* Hover actions (rendered on the inner side of the bubble) */}
          {!deleted && (onReply || canModify || canReact) && (
            <div
              className={`relative flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${
                pickerOpen ? "opacity-100" : ""
              } ${isMe ? "order-first" : "order-last"}`}
            >
              {canReact && (
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  aria-label="Add reaction"
                  aria-expanded={pickerOpen}
                  className="rounded-md p-1 text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]"
                >
                  <SmilePlus size={13} />
                </button>
              )}
              {canReact && pickerOpen && (
                <>
                  {/* Click-away backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setPickerOpen(false)}
                  />
                  <div
                    className={`absolute bottom-full z-20 mb-1 flex gap-0.5 rounded-full border border-[--surface-secondary] bg-[--surface] p-1 shadow-lg ${
                      isMe ? "right-0" : "left-0"
                    }`}
                  >
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReact(emoji)}
                        className="rounded-full px-1 text-base leading-none transition-transform hover:scale-125"
                        aria-label={`React ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {onReply && (
                <button
                  type="button"
                  onClick={() => onReply(message)}
                  aria-label="Reply"
                  className="rounded-md p-1 text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]"
                >
                  <CornerUpLeft size={13} />
                </button>
              )}
              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(message)}
                  aria-label="Edit"
                  className="rounded-md p-1 text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]"
                >
                  <Pencil size={13} />
                </button>
              )}
              {canModify && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(message)}
                  aria-label="Delete"
                  className="rounded-md p-1 text-[--muted] hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}

          <div
            className={`${bubbleBase} ${
              jumbo
                ? "bg-transparent! px-1! py-0!"
                : deleted
                  ? "border border-[--surface-secondary] bg-transparent italic text-[--muted]"
                  : bubbleTone
            } ${message.failed ? "ring-1 ring-danger" : ""}`}
          >
            {/* Reply quote */}
            {message.reply_to && !deleted && (
              <div
                className={`mb-1 rounded-lg border-l-2 px-2 py-1 text-[11px] ${
                  isMe
                    ? "border-white/50 bg-black/10"
                    : "border-[--accent]/50 bg-[--surface]"
                }`}
              >
                <span className="block font-semibold opacity-90">
                  {userDisplayName(message.reply_to.sender)}
                </span>
                <span className="line-clamp-2 opacity-75">
                  {message.reply_to.is_deleted
                    ? "Message deleted"
                    : message.reply_to.content || "Attachment"}
                </span>
              </div>
            )}

            {deleted ? (
              "This message was deleted"
            ) : (
              <>
                {message.type === "IMAGE" && message.attachment_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={message.attachment_url}
                    alt="attachment"
                    className="mb-1 max-h-64 rounded-lg object-cover"
                  />
                )}
                {message.type !== "IMAGE" &&
                  message.type !== "TEXT" &&
                  message.attachment_url && (
                    <a
                      href={message.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-1 flex items-center gap-2 rounded-lg bg-black/10 px-2 py-1.5 text-xs font-medium underline"
                    >
                      📎 Open attachment
                    </a>
                  )}
                {message.content && (
                  <span
                    className={
                      jumbo
                        ? "block leading-none text-5xl"
                        : "whitespace-pre-wrap"
                    }
                  >
                    {message.content}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reaction chips */}
        {reactions.length > 0 && (
          <div
            className={`mt-1 flex flex-wrap gap-1 ${
              isMe ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {reactions.map((r) => {
              const reacted = !!meId && r.user_ids.includes(meId);
              return (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => onReact?.(message, r.emoji)}
                  disabled={!canReact}
                  className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] leading-none transition-colors ${
                    reacted
                      ? "border-[--accent] bg-[--accent]/15 text-[--foreground]"
                      : "border-[--surface-secondary] bg-[--surface-secondary]/40 text-[--muted] hover:bg-[--surface-secondary]"
                  } ${canReact ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span className="text-xs">{r.emoji}</span>
                  <span className="font-semibold">{r.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Meta line */}
        <div
          className={`mt-0.5 flex items-center gap-1 px-1 text-[10px] text-[--muted] ${
            isMe ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span>{formatTime(message.created_at)}</span>
          {message.is_edited && !deleted && <span>· edited</span>}
          {message.pending && <Clock size={10} />}
          {message.failed && (
            <span className="flex items-center gap-0.5 text-danger">
              <AlertCircle size={10} /> Failed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

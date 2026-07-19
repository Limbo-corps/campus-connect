"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Clock,
  CornerUpLeft,
  Pencil,
  SmilePlus,
  Trash2,
  Check,
  CheckCheck,
} from "lucide-react";

import { ChatAvatar } from "./ChatAvatar";
import { formatTime, userDisplayName } from "@/lib/chat/format";
import { isEmojiOnly } from "@/lib/chat/emoji";
import type { LocalMessage } from "@/hooks/useMessages";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

interface MessageItemProps {
  message: LocalMessage;
  isMe: boolean;
  isGroup: boolean;
  showHeader: boolean;
  meId?: string;
  participantsDetail?: Array<{
    user: { id: string };
    last_read_message?: string | null;
    last_read_at?: string | null;
  }>;
  onReply?: (message: LocalMessage) => void;
  onEdit?: (message: LocalMessage) => void;
  onDelete?: (message: LocalMessage) => void;
  onReact?: (message: LocalMessage, emoji: string) => void;
}

export const MessageItem = React.memo(
  function MessageItem({
    message,
    isMe,
    isGroup,
    showHeader,
    meId,
    participantsDetail = [],
    onReply,
    onEdit,
    onDelete,
    onReact,
  }: MessageItemProps) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const deleted = message.is_deleted;
    const isBot = !!message.bot;

    const jumbo = React.useMemo(() => {
      return (
        !deleted &&
        message.type === "TEXT" &&
        !message.attachment_url &&
        isEmojiOnly(message.content)
      );
    }, [deleted, message.type, message.attachment_url, message.content]);

    const canEdit =
      isMe && !deleted && !isBot && message.type === "TEXT" && !jumbo;
    const canModify = isMe && !deleted && !isBot;
    const canReact = !!onReact && !deleted && !isBot && !message.pending;
    const reactions = message.reactions ?? [];

    // ── Cumulative Read Status Logic ──
    const isSeen = React.useMemo(() => {
      if (!isMe || message.pending || message.failed || deleted) return false;

      const currentMsgTime = new Date(message.created_at).getTime();

      return participantsDetail.some((p) => {
        if (p.user.id === meId) return false;

        // Exact match baseline
        if (p.last_read_message === message.id) return true;

        // Cumulative chronological fallback check
        if (p.last_read_at) {
          const lastReadTime = new Date(p.last_read_at).getTime();
          return lastReadTime >= currentMsgTime;
        }

        return false;
      });
    }, [
      isMe,
      message.id,
      message.created_at,
      message.pending,
      message.failed,
      deleted,
      participantsDetail,
      meId,
    ]);

    useEffect(() => {
      if (!pickerOpen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setPickerOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [pickerOpen]);

    const handleReact = (emoji: string) => {
      onReact?.(message, emoji);
      setPickerOpen(false);
    };

    const renderMessageContent = (content: string) => {
      if (!content) return null;
      const parts = content.split(URL_REGEX);
      if (parts.length === 1) return content;

      return parts.map((part, index) => {
        if (part.match(URL_REGEX)) {
          const href = part.toLowerCase().startsWith("http")
            ? part
            : `https://${part}`;
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--accent] underline hover:text-[--accent-hover] break-all font-medium transition-colors duration-150"
            >
              {part}
            </a>
          );
        }
        return part;
      });
    };

    const bubbleBase =
      "relative max-w-[72%] px-4 py-2.5 text-[14px] leading-relaxed break-words transition-all duration-200 ease-out";
    const bubbleTone =
      "bg-[--surface] text-[--foreground] shadow-sm border border-[--border]";

    const cornerStyle = isMe
      ? {
          borderRadius:
            "var(--radius-3xl) var(--radius-3xl) var(--radius-sm) var(--radius-3xl)",
        }
      : {
          borderRadius:
            "var(--radius-3xl) var(--radius-3xl) var(--radius-3xl) var(--radius-sm)",
        };

    return (
      <div
        className={`group flex items-end gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} ${showHeader ? "mt-5" : "mt-1.5"}`}
      >
        {!isMe &&
          (showHeader ? (
            <div className="mb-0.5 transition-transform duration-200 hover:scale-105">
              <ChatAvatar
                name={userDisplayName(message.sender)}
                avatarUrl={message.sender.avatar_url}
                size="sm"
              />
            </div>
          ) : (
            <span className="w-8 shrink-0" aria-hidden="true" />
          ))}

        <div
          className={`flex min-w-0 flex-col ${isMe ? "items-end" : "items-start"}`}
        >
          {showHeader && !isMe && (isGroup || isBot) && (
            <span className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-extrabold tracking-widest text-[--muted] uppercase">
              {userDisplayName(message.sender)}
              {isBot && (
                <span
                  className="bg-[--bg-wash] px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase text-[--accent] border border-[--accent]/20"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  BOT
                </span>
              )}
            </span>
          )}

          <div className="flex items-end gap-2 w-full">
            {!deleted && (onReply || canModify || canReact) && (
              <div
                ref={pickerRef}
                className={`relative flex items-center gap-0.5 border border-[--border] bg-[--surface] p-1 shadow-md opacity-0 transition-all duration-150 transform translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0 ${pickerOpen ? "opacity-100 translate-y-0" : ""} ${isMe ? "order-first" : "order-last"}`}
                style={{ borderRadius: "var(--radius-lg)" }}
              >
                {canReact && (
                  <button
                    type="button"
                    onClick={() => setPickerOpen((v) => !v)}
                    aria-label="Add reaction"
                    className="p-1.5 text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground] focus:outline-none transition-colors"
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    <SmilePlus size={14} />
                  </button>
                )}
                {canReact && pickerOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setPickerOpen(false)}
                      role="presentation"
                    />
                    <div
                      role="menu"
                      className={`absolute bottom-full z-20 mb-2 flex gap-1 border border-[--border] bg-[--surface] p-1.5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 ${isMe ? "right-0" : "left-0"}`}
                      style={{ borderRadius: "var(--radius-3xl)" }}
                    >
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          role="menuitem"
                          onClick={() => handleReact(emoji)}
                          className="px-1.5 py-0.5 text-base transition-transform hover:scale-125 active:scale-95 focus:outline-none"
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
                    aria-label="Reply to message"
                    className="p-1.5 text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground] focus:outline-none transition-colors"
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    <CornerUpLeft size={14} />
                  </button>
                )}
                {canEdit && onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(message)}
                    aria-label="Edit message"
                    className="p-1.5 text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground] focus:outline-none transition-colors"
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {canModify && onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(message)}
                    aria-label="Delete message"
                    className="p-1.5 text-[--muted] hover:bg-danger/10 hover:text-danger focus:outline-none transition-colors"
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}

            <div
              className={`${bubbleBase} ${jumbo ? "bg-transparent shadow-none border-none px-0 py-0" : deleted ? "border border-[--border] bg-transparent italic text-[--muted] shadow-none" : bubbleTone} ${message.failed ? "border-[--danger] ring-1 ring-[--danger]" : ""}`}
              style={jumbo ? undefined : cornerStyle}
            >
              {message.reply_to && !deleted && (
                <div
                  className="mb-2 border-l-2 border-[--accent] bg-[--surface-secondary] px-2.5 py-1 text-xs max-w-full border-solid"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  <div className="flex items-center justify-between gap-4 mb-0.5">
                    <span className="block font-bold tracking-tight truncate text-[--foreground]">
                      {userDisplayName(message.reply_to.sender)}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold shrink-0 text-[--muted]">
                      Reply
                    </span>
                  </div>
                  <p className="truncate text-[11px] font-normal text-[--muted]">
                    {message.reply_to.is_deleted
                      ? "Message deleted"
                      : message.reply_to.content || "Attachment"}
                  </p>
                </div>
              )}

              {deleted ? (
                <span>This message was deleted</span>
              ) : (
                <>
                  {message.type === "IMAGE" && message.attachment_url && (
                    <div
                      className="relative mb-1.5 overflow-hidden border border-[--border] shadow-xs"
                      style={{ borderRadius: "var(--radius-lg)" }}
                    >
                      <Image
                        src={message.attachment_url}
                        alt="Attachment"
                        width={420}
                        height={260}
                        className="w-full h-auto max-h-64 object-cover transition-transform duration-300 hover:scale-[1.015]"
                      />
                    </div>
                  )}
                  {message.type !== "IMAGE" &&
                    message.type !== "TEXT" &&
                    message.attachment_url && (
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-1.5 flex items-center gap-2 bg-[--surface-secondary] px-3 py-2 text-xs font-semibold hover:bg-[--surface-tertiary] transition-colors border border-[--border]"
                        style={{ borderRadius: "var(--radius-md)" }}
                      >
                        📎 Open attachment
                      </a>
                    )}
                  {message.content && (
                    <span
                      className={
                        jumbo
                          ? "block text-5xl select-none"
                          : "whitespace-pre-wrap wrap-break-word font-normal"
                      }
                    >
                      {jumbo
                        ? message.content
                        : renderMessageContent(message.content)}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {reactions.length > 0 && (
            <div
              className={`mt-1.5 flex flex-wrap gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}
            >
              {reactions.map((r) => {
                const reacted = !!meId && r.user_ids.includes(meId);
                return (
                  <button
                    key={r.emoji}
                    type="button"
                    onClick={() => onReact?.(message, r.emoji)}
                    disabled={!canReact}
                    className={`flex items-center gap-1.5 border px-2.5 py-0.5 text-[11px] font-medium transition-all ${reacted ? "border-[--accent] bg-[--bg-wash] text-[--foreground]" : "border-[--border] bg-[--surface] text-[--muted] hover:text-[--foreground] hover:bg-[--surface-secondary]"} ${canReact ? "cursor-pointer" : "cursor-default"}`}
                    style={{ borderRadius: "var(--radius-3xl)" }}
                  >
                    <span>{r.emoji}</span>
                    <span className="font-bold text-[10px]">{r.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div
            className={`mt-1 flex items-center gap-1.5 px-1.5 text-[10px] text-[--muted] font-medium tracking-wide ${isMe ? "flex-row-reverse" : "flex-row"}`}
          >
            <time dateTime={message.created_at}>
              {formatTime(message.created_at)}
            </time>
            {message.is_edited && !deleted && <span>• edited</span>}

            {isMe && !message.pending && !message.failed && !deleted && (
              <span className="inline-flex items-center ml-0.5 text-[--accent]">
                {isSeen ? (
                  <CheckCheck size={13} className="stroke-[2.5]" />
                ) : (
                  <Check size={13} className="stroke-[2.5]" />
                )}
              </span>
            )}

            {message.pending && (
              <Clock size={10} className="animate-pulse text-[--accent]" />
            )}
            {message.failed && (
              <span className="flex items-center gap-0.5 text-[--danger] font-bold">
                <AlertCircle size={10} /> Failed
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
  // The optimized comparison function strategy
  (prevProps, nextProps) => {
    return (
      prevProps.showHeader === nextProps.showHeader &&
      prevProps.isMe === nextProps.isMe &&
      prevProps.isGroup === nextProps.isGroup &&
      prevProps.meId === nextProps.meId &&
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.is_deleted === nextProps.message.is_deleted &&
      prevProps.message.is_edited === nextProps.message.is_edited &&
      prevProps.message.pending === nextProps.message.pending &&
      prevProps.message.failed === nextProps.message.failed &&
      prevProps.message.created_at === nextProps.message.created_at &&
      // Strict dependency checks to ensure updates pierce through Memo smoothly
      prevProps.participantsDetail === nextProps.participantsDetail &&
      prevProps.message.reactions === nextProps.message.reactions
    );
  },
);

export default MessageItem;

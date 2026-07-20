"use client";

import React from "react";
import { CornerUpLeft } from "lucide-react";

import { ChatAvatar } from "./ChatAvatar";
import { MessageContextMenu } from "./MessageContextMenu";
import { HoverActionBar } from "./HoverActionBar";
import { MessageContent } from "./MessageContent";
import { MessageReactionsAndStatus } from "./MessageReactionsAndStatus";

import { formatTime, userDisplayName } from "@/lib/chat/format";
import { isEmojiOnly } from "@/lib/chat/emoji";
import type { LocalMessage } from "@/hooks/useMessages";

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
    showHeader,
    meId,
    participantsDetail = [],
    onReply,
    onEdit,
    onDelete,
    onReact,
  }: MessageItemProps) {
    const deleted = message.is_deleted;
    const isBot = !!message.bot;

    const [menuPosition, setMenuPosition] = React.useState<{
      x: number;
      y: number;
    } | null>(null);

    React.useEffect(() => {
      if (!menuPosition) return;

      const handleScrollOrKeyDown = (e: KeyboardEvent | Event) => {
        if ("key" in e && e.key !== "Escape") return;
        setMenuPosition(null);
      };

      window.addEventListener("keydown", handleScrollOrKeyDown);
      window.addEventListener("scroll", handleScrollOrKeyDown, true);
      return () => {
        window.removeEventListener("keydown", handleScrollOrKeyDown);
        window.removeEventListener("scroll", handleScrollOrKeyDown, true);
      };
    }, [menuPosition]);

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

    const isSeen = React.useMemo(() => {
      if (!isMe || message.pending || message.failed || deleted) return false;

      const currentMsgTime = new Date(message.created_at).getTime();

      return participantsDetail.some((p) => {
        if (p.user.id === meId) return false;
        if (p.last_read_message === message.id) return true;

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

    const handleContextMenu = (e: React.MouseEvent) => {
      if (deleted) return;
      e.preventDefault();

      const x = Math.min(e.clientX, window.innerWidth - 200);
      const y = Math.min(e.clientY, window.innerHeight - 220);

      setMenuPosition({ x, y });
    };

    const handleDoubleClick = () => {
      if (!deleted && onReply) {
        onReply(message);
      }
    };

    return (
      <div
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        className={`group relative flex w-full items-stretch gap-3.5 px-3.5 transition-colors duration-150 border-l-2 border-transparent hover:border-[var(--accent)] hover:bg-[var(--surface-secondary)] select-none ${
          showHeader ? "mt-3 pt-1 pb-0.5" : "mt-0 py-0.5"
        } ${message.pending ? "opacity-60" : ""}`}
      >
        {/* Right Click Context Menu */}
        <MessageContextMenu
          position={menuPosition}
          onClose={() => setMenuPosition(null)}
          message={message}
          canEdit={canEdit}
          canModify={canModify}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
        />

        {/* Hover Action Bar */}
        {!deleted && (onReply || canModify || canReact) && (
          <HoverActionBar
            message={message}
            canEdit={canEdit}
            canModify={canModify}
            canReact={canReact}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onReact={onReact}
          />
        )}

        {/* Avatar Column */}
        <div className="relative w-9 shrink-0 flex flex-col items-center justify-center select-none">
          {showHeader ? (
            <div className="z-10 transition-transform duration-200 hover:scale-105">
              <ChatAvatar
                name={userDisplayName(message.sender)}
                avatarUrl={message.sender.avatar_url}
                size="md"
              />
            </div>
          ) : (
            <time
              dateTime={message.created_at}
              className="z-10 text-[10px] text-[var(--muted)] font-mono opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0 leading-none my-auto"
            >
              {formatTime(message.created_at)}
            </time>
          )}
        </div>

        {/* Content & Payload */}
        <div className="flex flex-1 flex-col min-w-0 justify-center">
          {showHeader && (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-[13px] text-[var(--foreground)] hover:text-[var(--accent)] transition-colors cursor-pointer leading-none">
                {userDisplayName(message.sender)}
              </span>

              {isBot && (
                <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest uppercase border border-[var(--accent)]/20 rounded-md">
                  BOT
                </span>
              )}

              <time
                dateTime={message.created_at}
                className="text-[10px] text-[var(--muted)] font-medium"
              >
                {formatTime(message.created_at)}
              </time>
            </div>
          )}

          {message.reply_to && !deleted && (
            <div className="my-1 flex items-center gap-2 rounded-lg border-l-2 border-[var(--accent)] bg-[var(--surface-tertiary)] px-2.5 py-1 text-xs max-w-xl backdrop-blur-sm">
              <CornerUpLeft
                size={11}
                className="text-[var(--accent)] shrink-0"
              />
              <span className="font-semibold text-[11px] text-[var(--foreground)]">
                {userDisplayName(message.reply_to.sender)}
              </span>
              <p className="truncate text-[11px] text-[var(--muted)]">
                {message.reply_to.is_deleted
                  ? "Message deleted"
                  : message.reply_to.content || "Attachment"}
              </p>
            </div>
          )}

          <div className="text-[13.5px] leading-relaxed text-[var(--foreground)] break-words select-text">
            <MessageContent message={message} deleted={deleted} jumbo={jumbo} />
          </div>

          <MessageReactionsAndStatus
            message={message}
            isMe={isMe}
            meId={meId}
            isSeen={isSeen}
            deleted={deleted}
            canReact={canReact}
            onReact={onReact}
          />
        </div>
      </div>
    );
  },
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
      prevProps.participantsDetail === nextProps.participantsDetail &&
      prevProps.message.reactions === nextProps.message.reactions &&
      prevProps.onReply === nextProps.onReply
    );
  },
);

export default MessageItem;

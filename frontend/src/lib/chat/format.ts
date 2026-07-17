// @/lib/chat/format.ts
import type { ChatUser, Conversation, Message } from "@/types";

export function userDisplayName(user: ChatUser | null | undefined): string {
  if (!user) return "Unknown";
  const full = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return full || user.username;
}

export function userInitials(user: ChatUser | null | undefined): string {
  if (!user) return "?";
  const a = user.first_name?.[0] ?? "";
  const b = user.last_name?.[0] ?? "";
  return (a + b).toUpperCase() || user.username[0]?.toUpperCase() || "?";
}

/** Short clock time, e.g. "10:24 AM". */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Compact timestamp for conversation lists: time today, weekday this week, else date. */
export function formatListTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return formatTime(iso);

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now.getTime() - date.getTime()) / dayMs);
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Human day divider label for the message stream. */
export function formatDayDivider(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** One-line preview of a conversation's most recent message. */
export function messagePreview(message: Message | null): string {
  if (!message) return "No messages yet";
  if (message.is_deleted) return "Message deleted";
  switch (message.type) {
    case "IMAGE":
      return "📷 Photo";
    case "VIDEO":
      return "🎬 Video";
    case "AUDIO":
      return "🎵 Audio";
    case "FILE":
      return "📎 Attachment";
    default:
      return message.content || "";
  }
}

/**
 * The other participant of a direct conversation (the one who isn't `meId`).
 */
export function otherParticipant(
  conversation: Conversation,
  meId: string | null | undefined,
): ChatUser | null {
  if (conversation.other_user) return conversation.other_user;
  const membership = conversation.participants_detail?.find(
    (p) => p.user.id !== meId,
  );
  return membership?.user ?? null;
}

/** Whether two consecutive messages should be visually grouped (same sender, close in time). */
export function shouldGroup(prev: Message | undefined, curr: Message): boolean {
  if (!prev) return false;
  if (prev.sender.id !== curr.sender.id) return false;
  const gap =
    new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
  return gap < 5 * 60 * 1000; // within 5 minutes
}

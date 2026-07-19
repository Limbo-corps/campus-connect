// @/types/chat.ts

export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE" | "SYSTEM";

export interface ChatUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  // Optional small profile fields surfaced in chat UIs.
  tagline?: string | null;
  bio?: string | null;
}

export interface ReplyPreview {
  id: string;
  sender: ChatUser;
  type: MessageType;
  content: string;
  is_deleted: boolean;
}

/**
 * Reactions grouped by emoji for a single message. Viewer-agnostic: the same
 * payload reaches every participant, and each client derives whether *it*
 * reacted from `user_ids` (so a broadcast never leaks the actor's state).
 */
export interface ReactionGroup {
  emoji: string;
  count: number;
  /** IDs of the users who reacted with this emoji. */
  user_ids: string[];
}

export interface Message {
  id: string;
  conversation: string;
  sender: ChatUser;
  type: MessageType;
  content: string;
  attachment_url: string | null;
  reply_to: ReplyPreview | null;
  edited_at: string | null;
  deleted_at: string | null;
  is_deleted: boolean;
  is_edited: boolean;
  reactions: ReactionGroup[];
  created_at: string;
}

export interface Participant {
  user: ChatUser;
  is_admin: boolean;
  joined_at: string;
  is_muted: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  last_read_message: string | null;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name: string;
  display_name: string;
  image_url: string | null;
  owner: ChatUser;
  participants_detail: Participant[];
  other_user: ChatUser | null;
  last_message: Message | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface MessagePage {
  results: Message[];
  has_more: boolean;
}

// ── WebSocket event envelope ──────────────────────────────────────────────
export type ChatEventName =
  | "message.created"
  | "message.updated"
  | "message.deleted"
  | "reaction.updated"
  | "conversation.created"
  | "conversation.updated"
  | "conversation.deleted"
  | "participant.joined"
  | "participant.left"
  | "read_receipt.updated"
  | "typing.started"
  | "typing.stopped"
  | "presence.updated"
  | "presence.snapshot"
  | "pong";

export interface ReadReceiptPayload {
  conversation_id: string;
  user_id: string;
  last_read_message: string;
  last_read_at?: string | null;
}

export interface ChatEvent<T = unknown> {
  event: ChatEventName;
  data: T;
}

export interface TypingPayload {
  conversation: string;
  user_id: string;
  username: string;
  is_typing: boolean;
}

export interface PresencePayload {
  user_id: string;
  is_online: boolean;
}


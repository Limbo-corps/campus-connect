// @/lib/chat/api.ts
import api from "@/lib/api";
import type { Conversation, Message, MessagePage } from "@/types";

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>("/chat/conversations/");
  return data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const { data } = await api.get<Conversation>(`/chat/conversations/${id}/`);
  return data;
}

/**
 * Create a conversation. With a single participant this reuses (or creates) a
 * direct conversation; with several it creates a group.
 */
export async function createConversation(
  participantIds: string[],
  name?: string,
): Promise<Conversation> {
  const { data } = await api.post<Conversation>("/chat/conversations/", {
    participant_ids: participantIds,
    name: name || undefined,
  });
  return data;
}

export async function renameGroup(
  id: string,
  name: string,
): Promise<Conversation> {
  const { data } = await api.patch<Conversation>(`/chat/conversations/${id}/`, {
    name,
  });
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  await api.delete(`/chat/conversations/${id}/`);
}

export async function leaveConversation(id: string): Promise<void> {
  await api.post(`/chat/conversations/${id}/leave/`);
}

export async function addParticipant(
  conversationId: string,
  userId: string,
): Promise<Conversation> {
  const { data } = await api.post<Conversation>(
    `/chat/conversations/${conversationId}/participants/`,
    { user_id: userId },
  );
  return data;
}

export async function removeParticipant(
  conversationId: string,
  userId: string,
): Promise<void> {
  await api.delete(
    `/chat/conversations/${conversationId}/participants/${userId}/`,
  );
}

export async function getMessages(
  conversationId: string,
  opts: { before?: string; limit?: number } = {},
): Promise<MessagePage> {
  const params = new URLSearchParams();
  if (opts.before) params.set("before", opts.before);
  if (opts.limit) params.set("limit", String(opts.limit));
  const query = params.toString();
  const { data } = await api.get<MessagePage>(
    `/chat/conversations/${conversationId}/messages/${query ? `?${query}` : ""}`,
  );
  return data;
}

export interface SendMessageInput {
  content?: string;
  attachment?: File | null;
  replyTo?: string | null;
  type?: string;
}

export async function sendMessage(
  conversationId: string,
  input: SendMessageInput,
): Promise<Message> {
  const url = `/chat/conversations/${conversationId}/messages/`;

  if (input.attachment) {
    const form = new FormData();
    if (input.content) form.append("content", input.content);
    form.append("attachment", input.attachment);
    if (input.replyTo) form.append("reply_to", input.replyTo);
    if (input.type) form.append("type", input.type);
    const { data } = await api.post<Message>(url, form);
    return data;
  }

  const { data } = await api.post<Message>(url, {
    content: input.content ?? "",
    reply_to: input.replyTo ?? undefined,
    type: input.type ?? undefined,
  });
  return data;
}

export async function editMessage(
  messageId: string,
  content: string,
): Promise<Message> {
  const { data } = await api.patch<Message>(`/chat/messages/${messageId}/`, {
    content,
  });
  return data;
}

export async function deleteMessage(messageId: string): Promise<Message> {
  const { data } = await api.delete<Message>(`/chat/messages/${messageId}/`);
  return data;
}

/**
 * Toggle an emoji reaction on a message (adds it, or removes it if the current
 * user already reacted with that emoji). Returns the updated message.
 */
export async function reactToMessage(
  messageId: string,
  emoji: string,
): Promise<Message> {
  const { data } = await api.post<Message>(
    `/chat/messages/${messageId}/reactions/`,
    { emoji },
  );
  return data;
}

const _lastMarkReadAt = new Map<string, number>();

export async function markRead(
  conversationId: string,
  messageId?: string,
): Promise<void> {
  // Prevent sending network requests for temporary client-side IDs
  if (messageId && messageId.startsWith("temp-")) {
    return;
  }

  // Coalesce rapid repeated markRead calls per conversation to avoid spamming
  // the API (debounce window: 1000ms). This helps prevent server-side rate
  // limit (429) and reduces Redis load from downstream presence updates.
  const now = Date.now();
  const last = _lastMarkReadAt.get(conversationId) ?? 0;
  if (now - last < 1000) {
    return;
  }
  _lastMarkReadAt.set(conversationId, now);

  await api.post(`/chat/conversations/${conversationId}/read/`, {
    message_id: messageId,
  });
}

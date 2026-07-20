// app/chat/layout.tsx
"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button } from "@heroui/react";
import { Plus, Search, MessageSquare } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import {
  messagePreview,
  otherParticipant,
  userDisplayName,
} from "@/lib/chat/format";
import { ChatListItem } from "@/components/chat/ChatListItem";
import { ProfileDeck } from "@/components/chat/ProfileDeck";
import AddDirectMessageModal from "@/components/chat/AddDirectMessageModal";
import type { Conversation } from "@/types";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();
  const params = useParams();
  const activeChatId = typeof params?.id === "string" ? params.id : "";

  const { user } = useAuth();
  const meId = user?.id ?? null;
  const { conversations, loading, getPresence, upsertConversation } = useChat();

  const myPresence = getPresence(meId);

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = c.is_group
        ? c.display_name
        : userDisplayName(otherParticipant(c, meId));
      const preview = messagePreview(c.last_message);
      return (
        name.toLowerCase().includes(q) || preview.toLowerCase().includes(q)
      );
    });
  }, [query, conversations, meId]);

  const handleCreated = (conversation: Conversation) => {
    upsertConversation(conversation);
    router.push(`/chat/${conversation.id}`);
  };

  return (
    <div className="relative flex h-full w-full animate-in fade-in gap-4 p-2 sm:p-4 duration-300 lg:grid lg:grid-cols-12">
      {/* ── LEFT RAIL: CONVERSATIONS PANEL ── */}
      <aside
        className={`col-span-12 flex h-full flex-col overflow-hidden lg:col-span-4 xl:col-span-3 ${
          activeChatId ? "hidden lg:flex" : "flex w-full lg:w-auto"
        }`}
      >
        <Card className="flex flex-1 flex-col gap-3.5 overflow-hidden border border-[--surface-secondary] bg-[--surface]/80 p-3.5 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-[--foreground]">
              <MessageSquare size={16} className="text-[--accent]" />
              Direct Messages
            </h2>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl border-none bg-[--accent]/10 text-[--accent] transition-all hover:bg-[--accent]/20"
              aria-label="New Message"
            >
              <Plus size={16} />
            </Button>
          </div>

          <label className="flex items-center gap-2 rounded-2xl border border-[--surface-secondary] bg-transparent px-3 py-2 focus-within:border-[--accent]/50">
            <Search size={14} className="text-[--muted]" />
            <input
              placeholder="Search conversations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[--foreground] outline-none placeholder:text-[--muted]"
            />
          </label>

          <hr className="my-0.5 border-[--surface-secondary] opacity-60" />

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5 [scrollbar-color:var(--scrollbar)_transparent] [scrollbar-width:thin]">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl p-3"
                  >
                    <div className="h-10 w-10 animate-pulse rounded-full bg-[--surface-secondary]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-[--surface-secondary]" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-[--surface-secondary]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <MessageSquare size={28} className="mb-2 text-[--muted]" />
                <p className="text-sm font-semibold text-[--foreground]">
                  {query ? "No matches" : "No conversations yet"}
                </p>
                <p className="mt-1 text-xs text-[--muted]">
                  {query
                    ? "Try a different search."
                    : "Start a new message to get chatting."}
                </p>
              </div>
            ) : (
              filteredChats.map((conversation) => (
                <ChatListItem
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeChatId}
                  meId={meId}
                  getPresence={getPresence}
                />
              ))
            )}
          </div>

          <div className="mt-auto border-t border-[--surface-secondary] pt-2.5">
            <ProfileDeck presence={myPresence} />
          </div>
        </Card>
      </aside>

      {/* ── RIGHT: ACTIVE THREAD ── */}
      <div
        className={`col-span-12 h-full overflow-hidden bg-transparent lg:col-span-8 xl:col-span-9 ${
          !activeChatId ? "hidden lg:block" : "block w-full lg:w-auto"
        }`}
      >
        {children}
      </div>

      <AddDirectMessageModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}

// app/chat/layout.tsx
"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Input, Button, Badge } from "@heroui/react";
import { Plus, Search, MessageSquare } from "lucide-react";

import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { ProfileDeck } from "@/components/chat/ProfileDeck";
import AddDirectMessageModal from "@/components/chat/AddDirectMessageModal"; // Import here

const MOCK_CHATS = [
  {
    id: "1",
    name: "Sarah Jenkins",
    lastMsg: "See you at the campus coffee shop!",
    time: "10:24 AM",
    unread: 2,
    online: true,
    role: "Classmate",
  },
  {
    id: "2",
    name: "Professor Davis",
    lastMsg: "Please review the syllabus update.",
    time: "Yesterday",
    unread: 0,
    online: false,
    role: "Faculty",
  },
  {
    id: "3",
    name: "Study Group Alpha",
    lastMsg: "Who has the study guide for tomorrow?",
    time: "Monday",
    unread: 5,
    online: true,
    role: "Group chat",
  },
];

export default function ChatLayout({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chats, setChats] = useState(MOCK_CHATS);

  const params = useParams();
  const activeChatId = typeof params?.id === "string" ? params.id : "";

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(q) ||
        chat.lastMsg.toLowerCase().includes(q) ||
        chat.role.toLowerCase().includes(q),
    );
  }, [query, chats]);

  const handleAddChat = (name: string, role: string) => {
    const newChat = {
      id: (chats.length + 1).toString(),
      name,
      lastMsg: "Channel created. Start the conversation!",
      time: "11:08 PM",
      unread: 0,
      online: true,
      role,
    };
    setChats([newChat, ...chats]);
  };

  return (
    <div className="flex lg:grid lg:grid-cols-12 gap-4 h-full w-full max-w-[1600px] mx-auto p-4 animate-in fade-in duration-300 relative">
      {/* ── LEFT RAIL: CONVERSATIONS PANEL ── */}
      <aside
        className={`col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col h-full overflow-hidden ${activeChatId ? "hidden lg:flex" : "flex w-full lg:w-auto"}`}
      >
        <Card className="flex-1 flex flex-col overflow-hidden border border-[--surface-secondary] bg-[--surface]/80 backdrop-blur-md shadow-sm p-3.5 gap-3.5">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-sm font-bold tracking-tight text-[--foreground] flex items-center gap-2">
              <MessageSquare size={16} className="text-[--accent]" />
              Direct Messages
            </h2>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onClick={() => setIsModalOpen(true)}
              className="bg-[--accent]/10 text-[--accent] rounded-xl hover:bg-[--accent]/20 transition-all border-none"
              aria-label="New Message"
            >
              <Plus size={16} />
            </Button>
          </div>

          <Input
            variant="secondary"
            radius="xl"
            placeholder="Search channels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startContent={<Search size={14} className="text-[--muted]" />}
            className="w-full"
            classNames={{
              inputWrapper:
                "border-[--surface-secondary] bg-transparent focus-within:!border-[--accent]/50",
            }}
          />

          <hr className="border-[--surface-secondary] opacity-60 my-0.5" />

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 [scrollbar-width:thin] [scrollbar-color:var(--scrollbar)_transparent]">
            {filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const hasUnread = chat.unread > 0;

              return (
                <Link
                  href={`/chat/${chat.id}`}
                  key={chat.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                    isActive
                      ? "bg-[--accent]/10 border-[--accent]/20 text-[--foreground] shadow-xs"
                      : "bg-transparent border-transparent hover:bg-[--surface-secondary]/40 text-[--foreground]/80"
                  }`}
                >
                  <Badge
                    content=""
                    color={chat.online ? "success" : "default"}
                    placement="bottom-right"
                    disableOutline
                    size="sm"
                  >
                    <ChatAvatar name={chat.name} />
                  </Badge>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p
                        className={`text-xs truncate ${hasUnread && !isActive ? "font-bold text-[--foreground]" : "font-semibold"}`}
                      >
                        {chat.name}
                      </p>
                      <span className="text-[9px] text-[--muted] shrink-0">
                        {chat.time}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] truncate mt-0.5 ${hasUnread && !isActive ? "text-[--foreground] font-medium" : "text-[--muted]"}`}
                    >
                      {chat.lastMsg}
                    </p>
                  </div>

                  {hasUnread && !isActive && (
                    <span className="h-4 min-w-4 px-1 rounded-md bg-[--accent] text-[9px] font-bold text-[--accent-foreground] flex items-center justify-center shrink-0 shadow-xs">
                      {chat.unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto pt-2.5 border-t border-[--surface-secondary]">
            <ProfileDeck />
          </div>
        </Card>
      </aside>

      {/* ── RIGHT MATRIX ── */}
      <div
        className={`col-span-12 lg:col-span-8 xl:col-span-9 h-full overflow-hidden bg-transparent ${!activeChatId ? "hidden lg:block" : "block w-full lg:w-auto"}`}
      >
        {children}
      </div>

      {/* Modern Refactored Direct Message Modular Dialog Hook */}
      <AddDirectMessageModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddChat={handleAddChat}
      />
    </div>
  );
}

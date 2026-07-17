// components/chat/ChatListItem.tsx
import React from "react";
import Link from "next/link";
import { ChatAvatar } from "./ChatAvatar";

interface ChatItemData {
  id: string;
  name: string;
  role: string;
  unread: number;
  online: boolean;
}

interface ChatListItemProps {
  chat: ChatItemData;
}

export function ChatListItem({ chat }: ChatListItemProps) {
  return (
    <Link
      href={`/chat/${chat.id}`}
      className="group mb-0.5 flex items-center gap-3 rounded-md px-2 py-2 text-[--foreground]/70 transition-colors hover:bg-foreground/5 hover:text-[--foreground]"
    >
      <ChatAvatar name={chat.name} online={chat.online} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-[--foreground]">
            {chat.name}
          </p>
          {chat.unread > 0 && (
            <span className="h-2 w-2 rounded-full bg-danger" />
          )}
        </div>
        <p className="truncate text-xs text-[--foreground]/50 group-hover:text-[--foreground]/75">
          {chat.role}
        </p>
      </div>
    </Link>
  );
}

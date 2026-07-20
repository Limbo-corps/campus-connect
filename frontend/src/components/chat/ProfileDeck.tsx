// components/chat/ProfileDeck.tsx
"use client";

import Link from "next/link";
import { Wifi, WifiOff } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { ChatAvatar } from "./ChatAvatar";
import { StatusPicker } from "./StatusPicker";
import type { PresencePayload } from "@/types";

interface ProfileDeckProps {
  presence?: PresencePayload | null;
}

export function ProfileDeck({ presence }: ProfileDeckProps) {
  const { user } = useAuth();
  const { connected } = useChat();

  const name = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.username
    : "You";

  return (
    <div className="flex items-center justify-between gap-2 px-1 py-1">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link
          href={user?.username ? `/profile/${user.username}` : "/profile"}
          aria-label="Your profile"
        >
          <ChatAvatar
            name={name}
            avatarUrl={user?.avatar_url}
            presence={presence}
            size="sm"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[--foreground]">
            {name}
          </p>
          <StatusPicker />
        </div>
      </div>
      <span
        title={connected ? "Realtime connected" : "Reconnecting"}
        className={`shrink-0 ${connected ? "text-emerald-500" : "text-[--muted]"}`}
      >
        {connected ? <Wifi size={15} /> : <WifiOff size={15} />}
      </span>
    </div>
  );
}

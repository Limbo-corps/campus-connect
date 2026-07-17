// components/chat/ProfileDeck.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wifi, WifiOff } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import {
  getStatus,
  onStatusChange,
  statusOption,
  type UserStatus,
} from "@/lib/chat/status";
import { ChatAvatar } from "./ChatAvatar";
import { StatusPicker } from "./StatusPicker";

export function ProfileDeck() {
  const { user } = useAuth();
  const { connected } = useChat();
  const [status, setStatus] = useState<UserStatus>({ mode: "online" });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync status from localStorage on mount
    setStatus(getStatus());
    return onStatusChange(() => setStatus(getStatus()));
  }, []);

  const name = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
      user.username
    : "You";

  const option = statusOption(status.mode);
  // A disconnected socket, or "invisible", both read as grey.
  const dotHex =
    !connected || status.mode === "invisible" ? "#94a3b8" : option.hex;

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
            statusHex={dotHex}
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

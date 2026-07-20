"use client";

import React from "react";
import { Avatar } from "@heroui/react";
import { Users } from "lucide-react";
import type { PresencePayload } from "@/types/chat";

interface ChatAvatarProps {
  name: string;
  avatarUrl?: string | null;
  /** Pass the raw presence object or legacy boolean */
  presence?: PresencePayload | null;
  online?: boolean;
  isGroup?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Overrides the presence-dot color (e.g. status mode). Implies a dot. */
  statusHex?: string;
}

const DOT_SIZES: Record<NonNullable<ChatAvatarProps["size"]>, string> = {
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3.5",
};

/**
 * Resolves the color variant class for active users.
 */
function getStatusColorClass(presence?: PresencePayload | null): string {
  if (!presence) return "bg-emerald-500";

  switch (presence.status) {
    case "idle":
      return "bg-amber-500";
    case "dnd":
      return "bg-rose-500";
    case "online":
    default:
      return "bg-emerald-500";
  }
}

/**
 * Determines whether a status dot should be rendered.
 * Completely hides the dot if the status is invisible, offline, or in a group.
 */
function shouldShowDot(
  isGroup?: boolean,
  statusHex?: string,
  presence?: PresencePayload | null,
  online?: boolean,
): boolean {
  if (isGroup) return false;

  // 1. Evaluate presence payload first
  if (presence) {
    // If invisible or offline, NEVER show a status dot
    if (presence.status === "invisible" || !presence.is_online) {
      return false;
    }
    return true;
  }

  // 2. Legacy online prop fallback
  if (online !== undefined) {
    return online;
  }

  // 3. Fallback for custom status hex pickers (when presence object is absent)
  return statusHex !== undefined;
}

export function ChatAvatar({
  name,
  avatarUrl,
  presence,
  online,
  isGroup,
  size = "sm",
  className = "",
  statusHex,
}: ChatAvatarProps) {
  const showDot = shouldShowDot(isGroup, statusHex, presence, online);
  const dotColorClass = statusHex ? "" : getStatusColorClass(presence);
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="relative inline-flex shrink-0">
      <Avatar size={size} color="accent" className={className}>
        {avatarUrl ? <Avatar.Image src={avatarUrl} alt={name} /> : null}
        <Avatar.Fallback>
          {isGroup ? (
            <Users size={size === "lg" ? 24 : size === "md" ? 18 : 15} />
          ) : (
            initial
          )}
        </Avatar.Fallback>
      </Avatar>

      {showDot && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-background transition-colors ${
            DOT_SIZES[size]
          } ${dotColorClass}`}
          style={statusHex ? { backgroundColor: statusHex } : undefined}
        />
      )}
    </div>
  );
}

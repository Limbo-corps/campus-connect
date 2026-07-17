// components/chat/ChatAvatar.tsx
import React from "react";
import { Users } from "lucide-react";

interface ChatAvatarProps {
  name: string;
  avatarUrl?: string | null;
  online?: boolean;
  isGroup?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Overrides the presence-dot color (e.g. status mode). Implies a dot. */
  statusHex?: string;
}

const SIZES: Record<NonNullable<ChatAvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
};

const DOT_SIZES: Record<NonNullable<ChatAvatarProps["size"]>, string> = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

/**
 * Circular avatar for a chat participant or group. Renders the image when
 * present, otherwise the initial(s); shows an optional presence dot.
 */
export function ChatAvatar({
  name,
  avatarUrl,
  online,
  isGroup,
  size = "sm",
  className = "",
  statusHex,
}: ChatAvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const showDot = statusHex !== undefined || online !== undefined;

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`flex items-center justify-center overflow-hidden rounded-full bg-[--accent] font-bold text-[--accent-foreground] shadow-sm ${SIZES[size]}`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : isGroup ? (
          <Users size={size === "lg" ? 24 : size === "md" ? 18 : 15} />
        ) : (
          initial
        )}
      </div>
      {showDot && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[--surface] ${DOT_SIZES[size]} ${
            statusHex === undefined
              ? online
                ? "bg-emerald-500"
                : "bg-[--surface-secondary]"
              : ""
          }`}
          style={statusHex ? { backgroundColor: statusHex } : undefined}
        />
      )}
    </div>
  );
}

// components/chat/ChatAvatar.tsx
import React from "react";

interface ChatAvatarProps {
  name: string;
  online: boolean;
}

export function ChatAvatar({ name, online }: ChatAvatarProps) {
  return (
    <div className="relative shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--accent] text-xs font-bold text-[--accent-foreground] shadow-sm">
        {name.charAt(0)}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-transparent bg-success" />
      )}
    </div>
  );
}

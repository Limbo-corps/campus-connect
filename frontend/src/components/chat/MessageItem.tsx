// components/chat/MessageItem.tsx
import React from "react";

interface MessageItemProps {
  displayName: string;
  avatarLetter: string;
  text: string;
  time: string;
}

export function MessageItem({
  displayName,
  avatarLetter,
  text,
  time,
}: MessageItemProps) {
  return (
    <div className="group -mx-4 flex items-start gap-4 px-4 py-1.5 hover:bg-foreground/5 transition-colors rounded-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[--accent]/10 text-sm font-bold text-[--accent] border border-border/15">
        {avatarLetter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm text-[--foreground] hover:underline cursor-pointer">
            {displayName}
          </span>
          <span className="text-[10px] text-[--muted]">{time}</span>
        </div>
        <div className="mt-1 text-sm leading-6 text-[--foreground]/90">
          {text}
        </div>
      </div>
    </div>
  );
}

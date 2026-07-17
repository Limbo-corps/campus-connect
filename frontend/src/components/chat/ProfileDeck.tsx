// components/chat/ProfileDeck.tsx
import React from "react";
import { Mic, Headphones, Settings } from "lucide-react";

export function ProfileDeck() {
  return (
    <div className="flex h-13 shrink-0 items-center justify-between border-t border-border/15 px-2 py-2 bg-transparent">
      <div className="flex items-center gap-2 min-w-0 hover:bg-foreground/5 p-1 rounded-md cursor-pointer transition-colors">
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--accent] text-xs font-bold text-[--accent-foreground]">
            MP
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-border/20 bg-success" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[--foreground]">
            My Profile
          </p>
          <p className="text-[10px] text-success">Online</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5 text-[--foreground]/65">
        <button
          className="p-1.5 rounded-md hover:bg-foreground/5 hover:text-[--foreground] transition-colors"
          aria-label="Mute microphone"
        >
          <Mic size={15} />
        </button>
        <button
          className="p-1.5 rounded-md hover:bg-foreground/5 hover:text-[--foreground] transition-colors"
          aria-label="Toggle audio"
        >
          <Headphones size={15} />
        </button>
        <button
          className="p-1.5 rounded-md hover:bg-foreground/5 hover:text-[--foreground] transition-colors"
          aria-label="Settings"
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
}

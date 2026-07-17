// components/chat/ThreadHeader.tsx
import React from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Video } from "lucide-react";

interface ThreadHeaderProps {
  name: string;
  role: string;
}

export function ThreadHeader({ name, role }: ThreadHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/15 px-4 bg-white/5 dark:bg-black/5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/chat"
          className="lg:hidden text-[--muted] hover:text-[--foreground] mr-1"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="font-bold text-[--foreground] truncate text-sm">
          @ {name}
        </div>
        <span className="h-4 w-px bg-border/20" />
        <p className="hidden md:block truncate text-xs text-[--muted]">
          {role}
        </p>
      </div>

      <div className="flex items-center gap-4 text-[--muted]">
        <button
          className="hover:text-[--foreground] transition-colors"
          aria-label="Voice Call"
        >
          <Phone size={16} />
        </button>
        <button
          className="hover:text-[--foreground] transition-colors"
          aria-label="Video Call"
        >
          <Video size={16} />
        </button>
      </div>
    </header>
  );
}

// app/chat/page.tsx
"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-transparent h-full w-full">
      <header className="flex h-12 shrink-0 items-center border-b border-border/15 px-4 bg-white/5 dark:bg-black/5 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-bold text-[--foreground]">
          <MessageSquare size={18} className="text-[--muted]" />
          <span className="text-sm font-semibold">Direct Messages</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-transparent">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[--accent]/10 border border-border/15 text-[--accent] backdrop-blur-md">
          <MessageSquare size={36} />
        </div>
        <h1 className="text-xl font-bold text-[--foreground]">
          Keep up with the campus...
        </h1>
        <p className="mt-2 max-w-sm text-sm text-[--muted]">
          Select a teammate or open thread on the left side to continue your
          conversation.
        </p>
        <Link
          href="/chat/1"
          className="mt-6 rounded-md bg-[--accent] px-4 py-2 text-sm font-semibold text-[--accent-foreground] hover:opacity-90 transition-all shadow-md active:scale-95"
        >
          Open Sarah&apos;s chat
        </Link>
      </div>
    </main>
  );
}

// app/chat/page.tsx
"use client";

import { MessageSquare } from "lucide-react";
import { Card } from "@heroui/react";

export default function ChatPage() {
  return (
    <Card className="hidden h-full flex-col items-center justify-center border border-[--surface-secondary] bg-[--surface]/60 p-8 text-center shadow-sm backdrop-blur-md lg:flex">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[--surface-secondary] bg-[--accent]/10 text-[--accent]">
        <MessageSquare size={36} />
      </div>
      <h1 className="text-xl font-bold text-[--foreground]">
        Your messages
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[--muted]">
        Select a conversation from the left, or start a new one to chat with
        classmates across campus.
      </p>
    </Card>
  );
}

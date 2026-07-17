// app/chat/[id]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@heroui/react";
import { ShieldAlert, Milestone } from "lucide-react";

import { ThreadHeader } from "@/components/chat/ThreadHeader";
import { MessageItem } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";

type ConversationMessage = {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
};

const MOCK_CONVERSATION_DATA: Record<
  string,
  {
    name: string;
    role: string;
    subtext: string;
    messages: ConversationMessage[];
  }
> = {
  "1": {
    name: "Sarah Jenkins",
    role: "Computer Science",
    subtext: "Active in Presentation Slides Thread",
    messages: [
      {
        id: "1",
        sender: "them",
        text: "Hey! Are we still meeting up today?",
        time: "10:15 AM",
      },
      {
        id: "2",
        sender: "me",
        text: "Yes! Preparing the class presentation slides right now.",
        time: "10:18 AM",
      },
      {
        id: "3",
        sender: "them",
        text: "See you at the campus coffee shop!",
        time: "10:24 AM",
      },
    ],
  },
  "2": {
    name: "Professor Davis",
    role: "Software Engineering Faculty",
    subtext: "Academic Advisor Window",
    messages: [
      {
        id: "1",
        sender: "me",
        text: "Hello Professor, I sent you my research outline.",
        time: "Yesterday",
      },
      {
        id: "2",
        sender: "them",
        text: "Please review the syllabus update.",
        time: "Yesterday",
      },
    ],
  },
  "3": {
    name: "Study Group Alpha",
    role: "CS Cohort Delta",
    subtext: "6 Members Connected Online",
    messages: [
      {
        id: "1",
        sender: "them",
        text: "Does anyone have answers to Problem Set #4?",
        time: "Monday",
      },
      {
        id: "2",
        sender: "them",
        text: "Who has the study guide for tomorrow?",
        time: "Monday",
      },
    ],
  },
};

export default function ChatDetailPage() {
  const params = useParams();
  const chatId = typeof params?.id === "string" ? params.id : "1";

  const [inputVal, setInputVal] = useState("");
  const [conversations, setConversations] = useState(MOCK_CONVERSATION_DATA);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChatData = conversations[chatId] || {
    name: "Unknown Channel",
    role: "Guest Member",
    subtext: "Unverified Identity",
    messages: [],
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatData.messages.length, chatId]);

  const handleSendMessage = () => {
    if (!inputVal.trim()) return;

    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      sender: "me",
      text: inputVal.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setConversations((prev) => ({
      ...prev,
      [chatId]: {
        ...prev[chatId],
        messages: [...(prev[chatId]?.messages || []), newMessage],
      },
    }));
    setInputVal("");
  };

  return (
    <div className="grid grid-cols-9 gap-4 h-full w-full">
      {/* ── CENTRAL MESSAGING INTERFACE (6/9 columns) ── */}
      <main className="col-span-9 xl:col-span-6 flex flex-col h-full overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden border border-[--surface-secondary] bg-[--surface] shadow-sm">
          <ThreadHeader name={activeChatData.name} role={activeChatData.role} />

          {/* Messages Wrapper with Smooth Entry Transitions */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 [scrollbar-width:thin]">
            {activeChatData.messages.map((msg) => {
              const isMe = msg.sender === "me";
              return (
                <div
                  key={msg.id}
                  className="animate-in fade-in slide-in-from-bottom-1 duration-150"
                >
                  <MessageItem
                    displayName={isMe ? "You" : activeChatData.name}
                    avatarLetter={isMe ? "Y" : activeChatData.name.charAt(0)}
                    text={msg.text}
                    time={msg.time}
                  />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <MessageInput
            value={inputVal}
            placeholderName={activeChatData.name}
            onChange={setInputVal}
            onSubmit={handleSendMessage}
          />
        </Card>
      </main>

      {/* ── RIGHT RAIL: CHAT ROOM METADATA BENTO (3/9 columns) ── */}
      <aside className="hidden xl:flex flex-col col-span-3 h-full overflow-hidden">
        <div className="sticky top-0 space-y-3 w-full">
          {/* Profile Details Card */}
          <Card className="border border-[--surface-secondary] bg-[--surface] shadow-sm p-4 text-center flex flex-col items-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[--accent] to-fuchsia-500 text-md font-bold text-white shadow-md">
              {activeChatData.name.charAt(0)}
            </div>
            <h3 className="text-sm font-bold text-[--foreground]">
              {activeChatData.name}
            </h3>
            <p className="text-[11px] font-medium text-[--accent] mt-0.5">
              {activeChatData.role}
            </p>
            <p className="text-[10px] text-[--muted] mt-2 bg-[--surface-secondary] px-2.5 py-1 rounded-full border border-[--surface-secondary]">
              {activeChatData.subtext}
            </p>
          </Card>

          {/* Contextual Workspace Metrics */}
          <Card className="border border-[--surface-secondary] bg-[--surface] shadow-sm p-3">
            <p className="px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[--muted] flex items-center gap-1.5 mb-2">
              <Milestone size={11} className="text-[--accent]" />
              Channel Diagnostics
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[--surface-secondary] p-2.5 border border-[--surface-secondary]/40">
                <p className="text-md font-bold leading-none text-[--foreground]">
                  {activeChatData.messages.length}
                </p>
                <p className="mt-1 text-[9px] text-[--muted]">total logs</p>
              </div>
              <div className="rounded-xl bg-[--surface-secondary] p-2.5 border border-[--surface-secondary]/40 flex flex-col justify-between">
                <p className="text-md font-bold leading-none text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Secure
                </p>
                <p className="mt-1 text-[9px] text-[--muted]">connection</p>
              </div>
            </div>
          </Card>

          {/* Safety Notice Block */}
          <Card className="border border-amber-500/10 bg-amber-500/5 dark:bg-amber-500/5 shadow-none p-3.5 rounded-xl flex flex-row gap-3 items-start">
            <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                Campus Guideline Memo
              </h4>
              <p className="text-[10px] leading-normal text-[--muted] mt-1">
                Keep project code distributions compliant with campus
                guidelines. Review course policy before sharing exam materials.
              </p>
            </div>
          </Card>
        </div>
      </aside>
    </div>
  );
}

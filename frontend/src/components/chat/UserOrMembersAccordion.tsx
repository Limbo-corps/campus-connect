"use client";

import { Accordion } from "@heroui/react";
import { Info, Users, FileText } from "lucide-react";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { userDisplayName } from "@/lib/chat/format";
import type { Conversation, ChatUser } from "@/types";

export function UserOrMembersAccordion({
  conversation,
  other,
  meId,
  checkUserOnlineStatus,
}: {
  conversation: Conversation;
  other: ChatUser | null;
  meId: string | null;
  checkUserOnlineStatus: (id?: string) => boolean;
}) {
  if (!conversation.is_group) {
    return (
      <Accordion.Item id="details">
        <Accordion.Heading>
          <Accordion.Trigger className="rounded-lg border border-[--surface-secondary] bg-[--surface] px-3 py-2 text-xs font-bold text-[--foreground]">
            <span className="flex items-center gap-2">
              <Info size={16} className="text-[--muted]" />
              User Info
            </span>
            <Accordion.Indicator />
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body>
            <div className="pb-3 text-left space-y-3">
              <div className="flex items-start gap-2 border-t border-[--surface-secondary]/50 pt-2">
                <FileText
                  size={14}
                  className="mt-0.5 shrink-0 text-[--muted]"
                />
                <div className="w-full min-w-0">
                  <span className="block text-[9px] uppercase font-bold tracking-wider text-[--muted]">
                    About Me
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-[--foreground]">
                    {other?.bio || "Hi! I am new here."}
                  </p>
                </div>
              </div>
            </div>
          </Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    );
  }

  return (
    <Accordion.Item id="members">
      <Accordion.Heading>
        <Accordion.Trigger className="rounded-lg border border-[--surface-secondary] bg-[--surface] px-3 py-2 text-xs font-bold text-[--foreground]">
          <span className="flex items-center gap-2">
            <Users size={16} className="text-[--muted]" />
            Group Members
          </span>
          <Accordion.Indicator />
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body>
          <div className="max-h-48 space-y-2 overflow-y-auto pb-2 pr-1 [scrollbar-width:thin]">
            {conversation.participants_detail?.map((p) => (
              <div key={p.user.id} className="flex items-center gap-2">
                <ChatAvatar
                  name={userDisplayName(p.user)}
                  avatarUrl={p.user.avatar_url}
                  online={checkUserOnlineStatus(p.user.id)}
                  size="sm"
                />
                <span className="flex-1 truncate text-xs text-[--foreground]">
                  {userDisplayName(p.user)}
                  {p.user.id === meId && " (you)"}
                </span>
                {p.is_admin && (
                  <span className="text-[9px] font-semibold text-[--accent]">
                    admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

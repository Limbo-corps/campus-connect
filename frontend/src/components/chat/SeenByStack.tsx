"use client";

import React from "react";
import { Popover, Button } from "@heroui/react";

import { ChatAvatar } from "./ChatAvatar";
import { formatTime, userDisplayName } from "@/lib/chat/format";
import type { Participant } from "@/types/chat";

const MAX_INLINE = 5;

interface SeenByStackProps {
  /** Participants who have read up to this message. */
  readers: Participant[];
}

/**
 * Instagram-style "seen by" indicator for group messages: a stack of up to 5
 * reader avatars (+N for the rest), clickable to open a popover listing every
 * reader with their name, username and last-read time.
 */
export function SeenByStack({ readers }: SeenByStackProps) {
  if (readers.length === 0) return null;

  const inline = readers.slice(0, MAX_INLINE);
  const extra = readers.length - inline.length;

  return (
    <Popover>
      <Popover.Trigger>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Seen by ${readers.length} ${readers.length === 1 ? "person" : "people"}`}
          className="flex h-auto min-w-0 items-center gap-0.5 rounded-full p-0.5 hover:bg-[--surface-secondary]"
        >
          <div className="flex -space-x-1.5">
            {inline.map((p) => (
              <span
                key={p.user.id}
                className="rounded-full ring-1 ring-[--surface]"
              >
                <ChatAvatar
                  name={userDisplayName(p.user)}
                  avatarUrl={p.user.avatar_url}
                  size="sm"
                  className="size-4 text-[8px]"
                />
              </span>
            ))}
          </div>
          {extra > 0 && (
            <span className="ml-0.5 text-[10px] font-semibold text-[--muted]">
              +{extra}
            </span>
          )}
        </Button>
      </Popover.Trigger>

      <Popover.Content className="border border-[--surface-secondary] p-0 shadow-2xl">
        <Popover.Dialog className="w-56 rounded-xl bg-[--surface] p-2">
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-[--muted]">
            Seen by
          </p>
          <div className="max-h-64 space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
            {readers.map((p) => (
              <div
                key={p.user.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              >
                <ChatAvatar
                  name={userDisplayName(p.user)}
                  avatarUrl={p.user.avatar_url}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[--foreground]">
                    {userDisplayName(p.user)}
                  </p>
                  <p className="truncate text-[10px] text-[--muted]">
                    @{p.user.username}
                  </p>
                </div>
                {p.last_read_at && (
                  <span className="shrink-0 text-[10px] text-[--muted]">
                    {formatTime(p.last_read_at)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

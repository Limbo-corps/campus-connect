"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LogOut,
  MoreVertical,
  Palette,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";

import { ChatAvatar } from "./ChatAvatar";
import { otherParticipant, userDisplayName } from "@/lib/chat/format";
import type { Conversation } from "@/types";

interface ThreadHeaderProps {
  conversation: Conversation;
  meId: string | null;
  isOnline: (userId: string | null | undefined) => boolean;
  typingText?: string | null;
  onRename?: () => void;
  onAddPeople?: () => void;
  onLeave?: () => void;
  onDelete?: () => void;
  onOpenTheme?: () => void;
}

export function ThreadHeader({
  conversation,
  meId,
  isOnline,
  typingText,
  onRename,
  onAddPeople,
  onLeave,
  onDelete,
  onOpenTheme,
}: ThreadHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const isGroup = conversation.is_group;
  const other = otherParticipant(conversation, meId);
  const name = isGroup
    ? conversation.display_name || "Group chat"
    : userDisplayName(other);

  const isOwner = conversation.owner?.id === meId;
  const myMembership = conversation.participants_detail?.find(
    (p) => p.user.id === meId,
  );
  const isAdmin = isOwner || Boolean(myMembership?.is_admin);

  const memberCount = conversation.participants_detail?.length ?? 0;
  const online = !isGroup && isOnline(other?.id);

  const subtitle =
    typingText ||
    (isGroup
      ? `${memberCount} member${memberCount === 1 ? "" : "s"}`
      : online
        ? "Online"
        : "Offline");

  const hasMenu = isGroup || isOwner;

  // Route routing utility targeting specific user handles
  const handleHeaderClick = () => {
    if (!isGroup && other?.username) {
      router.push(`/profile/${other.username}`);
    }
  };

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-[--surface-secondary] bg-[--surface]/80 px-4 backdrop-blur-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link
          href="/chat"
          className="mr-1 text-[--muted] hover:text-[--foreground] lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} />
        </Link>

        {/* Clickable Profile Identity wrapper zone */}
        <div
          role={!isGroup && other?.username ? "button" : undefined}
          tabIndex={!isGroup && other?.username ? 0 : undefined}
          onClick={handleHeaderClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleHeaderClick();
            }
          }}
          className={`flex min-w-0 items-center gap-3 select-none outline-none ${
            !isGroup && other?.username ? "cursor-pointer group" : ""
          }`}
        >
          <div className="transition-transform duration-150 group-hover:scale-[1.03]">
            <ChatAvatar
              name={name}
              avatarUrl={isGroup ? conversation.image_url : other?.avatar_url}
              isGroup={isGroup}
              online={isGroup ? undefined : online}
              size="sm"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[--foreground] group-hover:underline decoration-[--muted]/40 underline-offset-2">
              {name}
            </p>
            <p
              className={`truncate text-[11px] ${
                typingText
                  ? "text-[--accent]"
                  : online
                    ? "text-emerald-500"
                    : "text-[--muted]"
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-4">
        {onOpenTheme && (
          <button
            onClick={onOpenTheme}
            aria-label="Chat theme"
            title="Chat theme"
            className="rounded-lg p-1.5 text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground]"
          >
            <Palette size={18} />
          </button>
        )}
        {hasMenu && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Conversation options"
              className="rounded-lg p-1.5 text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground]"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-[--surface-secondary] bg-[--surface] py-1 shadow-xl">
                {isGroup && isAdmin && (
                  <>
                    <MenuButton
                      icon={<Pencil size={14} />}
                      label="Rename group"
                      onClick={() => {
                        setMenuOpen(false);
                        onRename?.();
                      }}
                    />
                    <MenuButton
                      icon={<UserPlus size={14} />}
                      label="Add people"
                      onClick={() => {
                        setMenuOpen(false);
                        onAddPeople?.();
                      }}
                    />
                  </>
                )}
                {isGroup && !isOwner && (
                  <MenuButton
                    icon={<LogOut size={14} />}
                    label="Leave group"
                    danger
                    onClick={() => {
                      setMenuOpen(false);
                      onLeave?.();
                    }}
                  />
                )}
                {isOwner && (
                  <MenuButton
                    icon={<Trash2 size={14} />}
                    label={isGroup ? "Delete group" : "Delete conversation"}
                    danger
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.();
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-[--surface-secondary] ${
        danger ? "text-danger" : "text-[--foreground]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

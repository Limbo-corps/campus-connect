"use client";

import React, { useState } from "react";
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
import { Button, Dropdown, Label } from "@heroui/react";

import { ChatAvatar } from "./ChatAvatar";
import { RenameGroupModal } from "./RenameGroupModal";
import { DeleteConversationModal } from "./DeleteConversationModal";
import { otherParticipant, userDisplayName } from "@/lib/chat/format";
import type { Conversation, PresencePayload } from "@/types/chat";

interface ThreadHeaderProps {
  conversation: Conversation;
  meId: string | null;
  getPresence: (
    userId: string | null | undefined,
  ) => PresencePayload | undefined;
  typingText?: string | null;
  onRename?: (newName: string) => Promise<void> | void;
  onAddPeople?: () => void;
  onLeave?: () => void;
  onDelete?: () => void;
  onOpenTheme?: () => void;
}

export function ThreadHeader({
  conversation,
  meId,
  getPresence,
  typingText,
  onRename,
  onAddPeople,
  onLeave,
  onDelete,
  onOpenTheme,
}: ThreadHeaderProps) {
  const router = useRouter();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

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
  const presence = !isGroup ? getPresence(other?.id) : undefined;

  // Connection active state check
  const isUserOnline =
    Boolean(presence?.is_online) && presence?.status !== "invisible";

  // Dynamic text color mapping based on connection status
  const getStatusTextColor = () => {
    if (typingText) return "text-[--accent]";
    if (isGroup || !presence || !isUserOnline) return "text-[--muted]";

    switch (presence.status) {
      case "idle":
        return "text-amber-500";
      case "dnd":
        return "text-rose-500";
      case "online":
      default:
        return "text-emerald-500";
    }
  };

  // Helper to resolve primary connection status label
  const getMainStatusText = (): string => {
    if (!presence || !isUserOnline) {
      return presence?.last_seen
        ? `Last seen ${new Date(presence.last_seen).toLocaleString()}`
        : "Offline";
    }

    switch (presence.status) {
      case "idle":
        return "Idle";
      case "dnd":
        return "Do Not Disturb";
      case "online":
      default:
        return "Online";
    }
  };

  // Direct messages have no owner: either participant can remove them from
  // their own list. Groups keep the owner-only delete.
  const canDeleteConversation = isGroup ? isOwner : true;
  const hasMenu = isGroup || canDeleteConversation;

  const handleHeaderClick = () => {
    if (!isGroup && other?.username) {
      router.push(`/profile/${other.username}`);
    }
  };

  const handleAction = (key: React.Key) => {
    switch (key) {
      case "rename":
        setIsRenameOpen(true);
        break;
      case "add-people":
        onAddPeople?.();
        break;
      case "leave":
        onLeave?.();
        break;
      case "delete":
        setIsDeleteOpen(true);
        break;
      default:
        break;
    }
  };

  const handleRenameSubmit = async (newName: string) => {
    if (onRename) {
      await onRename(newName);
    }
  };

  // Custom status parameters (only rendered when user is online)
  const customText = presence?.custom_status?.trim();
  const customEmoji = presence?.custom_status_emoji?.trim();
  const formattedCustomStatus =
    isUserOnline && (customText || customEmoji)
      ? `${customEmoji ?? ""} ${customText ?? ""}`.trim()
      : null;

  return (
    <>
      <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-[--surface-secondary] bg-[--surface]/80 px-4 backdrop-blur-sm">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            className="mr-1 text-[--muted] hover:text-[--foreground] lg:hidden"
            aria-label="Back to conversations"
            onClick={() => router.push("/chat")}
          >
            <ArrowLeft size={18} />
          </Button>

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
                presence={presence}
                size="sm"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[--foreground] group-hover:underline decoration-[--muted]/40 underline-offset-2">
                {name}
              </p>

              {/* Subtitle / Status Display Zone */}
              <div className="flex items-center gap-1.5 truncate text-[11px]">
                {typingText ? (
                  <span className="truncate text-[--accent]">{typingText}</span>
                ) : isGroup ? (
                  <span className="truncate text-[--muted]">
                    {memberCount} member{memberCount === 1 ? "" : "s"}
                  </span>
                ) : (
                  <>
                    {/* Main Connection Status */}
                    <span className={`shrink-0 ${getStatusTextColor()}`}>
                      {getMainStatusText()}
                    </span>

                    {/* Custom Status Aside */}
                    {formattedCustomStatus && (
                      <>
                        <span className="text-[--muted] opacity-60">•</span>
                        <span className="truncate text-[--muted]">
                          {formattedCustomStatus}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-4">
          {onOpenTheme && (
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onPress={onOpenTheme}
              aria-label="Chat theme"
              className="text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]"
            >
              <Palette size={18} />
            </Button>
          )}

          {hasMenu && (
            <Dropdown>
              <Dropdown.Trigger className="rounded-lg p-1.5 text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground] outline-none">
                <MoreVertical size={18} />
              </Dropdown.Trigger>

              <Dropdown.Popover
                placement="bottom end"
                className="min-w-48 overflow-hidden rounded-xl border border-[--surface-secondary] bg-[--surface] py-1 shadow-xl"
              >
                <Dropdown.Menu onAction={handleAction}>
                  {isGroup && isAdmin && (
                    <Dropdown.Item
                      id="rename"
                      textValue="Rename group"
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium cursor-pointer transition-colors hover:bg-[--surface-secondary] text-[--foreground]"
                    >
                      <Pencil size={14} />
                      <Label>Rename group</Label>
                    </Dropdown.Item>
                  )}

                  {isGroup && isAdmin && (
                    <Dropdown.Item
                      id="add-people"
                      textValue="Add people"
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium cursor-pointer transition-colors hover:bg-[--surface-secondary] text-[--foreground]"
                    >
                      <UserPlus size={14} />
                      <Label>Add people</Label>
                    </Dropdown.Item>
                  )}

                  {isGroup && !isOwner && (
                    <Dropdown.Item
                      id="leave"
                      textValue="Leave group"
                      variant="danger"
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium cursor-pointer transition-colors hover:bg-[--surface-secondary] text-danger"
                    >
                      <LogOut size={14} />
                      <Label>Leave group</Label>
                    </Dropdown.Item>
                  )}

                  {canDeleteConversation && (
                    <Dropdown.Item
                      id="delete"
                      textValue={
                        isGroup ? "Delete group" : "Delete conversation"
                      }
                      variant="danger"
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium cursor-pointer transition-colors hover:bg-[--surface-secondary] text-danger"
                    >
                      <Trash2 size={14} />
                      <Label>
                        {isGroup ? "Delete group" : "Delete conversation"}
                      </Label>
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          )}
        </div>
      </header>

      {/* Group Rename Modal */}
      {isGroup && (
        <RenameGroupModal
          key={
            isRenameOpen
              ? `rename-${conversation.id}-${conversation.display_name}`
              : "closed"
          }
          isOpen={isRenameOpen}
          onOpenChange={setIsRenameOpen}
          currentName={conversation.display_name || "Group chat"}
          onRename={handleRenameSubmit}
        />
      )}

      <DeleteConversationModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        conversationName={name}
        isGroup={isGroup}
        onConfirm={() => onDelete?.()}
      />
    </>
  );
}

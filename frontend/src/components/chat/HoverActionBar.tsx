"use client";

import React, { useState } from "react";
import {
  CornerUpLeft,
  Pencil,
  SmilePlus,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { ButtonGroup, Button, Dropdown, Popover } from "@heroui/react";
import type { LocalMessage } from "@/hooks/useMessages";
import { MessageContextMenu } from "./MessageContextMenu";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface HoverActionBarProps {
  message: LocalMessage;
  canEdit: boolean;
  canModify: boolean;
  canReact: boolean;
  onReply?: (message: LocalMessage) => void;
  onEdit?: (message: LocalMessage) => void;
  onDelete?: (message: LocalMessage) => void;
  onReact?: (message: LocalMessage, emoji: string) => void;
}

export const HoverActionBar: React.FC<HoverActionBarProps> = ({
  message,
  canEdit,
  canModify,
  canReact,
  onReply,
  onEdit,
  onDelete,
  onReact,
}) => {
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fixed event type by targeting the element via e.currentTarget / e.target
  const handleMoreClick = (e: React.SyntheticEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setContextMenuPos({
      x: rect.left,
      y: rect.bottom + 6,
    });
  };

  const handleEmojiClick = (emoji: string) => {
    onReact?.(message, emoji);
  };

  const handleConfirmDelete = () => {
    setIsDeleteOpen(false);
    onDelete?.(message);
  };

  return (
    <>
      <div className="absolute right-4 -top-4 z-30 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <ButtonGroup
          size="sm"
          variant="ghost"
          className="p-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg backdrop-blur-md flex items-center gap-0"
        >
          {canReact && (
            <Dropdown>
              <Dropdown.Trigger
                aria-label="Add reaction"
                className="px-2.5 h-8 rounded-l-lg text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors"
              >
                <SmilePlus size={15} />
              </Dropdown.Trigger>
              <Dropdown.Popover
                placement="bottom end"
                className="border border-[var(--border)] bg-[var(--surface)] shadow-xl backdrop-blur-xl rounded-lg p-1.5"
              >
                <div className="flex flex-row gap-0.5 p-0.5">
                  {QUICK_EMOJIS.map((emoji) => (
                    <Button
                      key={`react-${emoji}`}
                      size="sm"
                      variant="ghost"
                      onPress={() => handleEmojiClick(emoji)}
                      className="px-1.5 min-w-7 h-7 rounded text-base transition-transform hover:scale-125 focus:outline-none cursor-pointer flex items-center justify-center"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </Dropdown.Popover>
            </Dropdown>
          )}

          {onReply && (
            <Button
              aria-label="Reply"
              onPress={() => onReply(message)}
              className="px-2.5 h-8 rounded-none text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] flex items-center border-none"
            >
              {canReact && <ButtonGroup.Separator />}
              <CornerUpLeft size={15} />
            </Button>
          )}

          {canEdit && onEdit && (
            <Button
              aria-label="Edit Message"
              onPress={() => onEdit(message)}
              className="px-2.5 h-8 rounded-none text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] flex items-center border-none"
            >
              {(canReact || onReply) && <ButtonGroup.Separator />}
              <Pencil size={15} />
            </Button>
          )}

          {/* Delete Action with Compact Popover Confirmation */}
          {canModify && onDelete && (
            <Popover isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <Popover.Trigger>
                <div className="flex items-center h-full">
                  <Button
                    aria-label="Delete Message"
                    className="px-2.5 h-8 rounded-none text-[var(--muted)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] flex items-center border-none bg-transparent"
                  >
                    {(canReact || onReply || canEdit) && (
                      <ButtonGroup.Separator />
                    )}
                    <Trash2 size={15} />
                  </Button>
                </div>
              </Popover.Trigger>
              <Popover.Content
                placement="top"
                className="border border-[var(--border)] bg-[var(--surface)] shadow-xl rounded-lg p-2 z-50 min-w-44"
              >
                <Popover.Dialog className="flex flex-col gap-1">
                  <Popover.Heading className="text-[11px] font-semibold text-[var(--foreground)] leading-tight">
                    Delete message?
                  </Popover.Heading>
                  <p className="text-[10px] leading-tight text-[var(--muted)]">
                    This action cannot be undone.
                  </p>
                  <div className="flex items-center justify-end gap-1 pt-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => setIsDeleteOpen(false)}
                      className="px-1.5 h-5 text-[10px] rounded text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onPress={handleConfirmDelete}
                      className="px-1.5 h-5 text-[10px] rounded bg-[var(--danger)] text-[var(--danger-foreground)] font-medium hover:opacity-90"
                    >
                      Delete
                    </Button>
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          )}

          <Button
            aria-label="More options"
            onClick={handleMoreClick}
            className="px-2.5 h-8 rounded-r-lg text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] flex items-center border-none"
          >
            {(canReact || onReply || canEdit || (canModify && onDelete)) && (
              <ButtonGroup.Separator />
            )}
            <MoreVertical size={15} />
          </Button>
        </ButtonGroup>
      </div>

      <MessageContextMenu
        position={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
        message={message}
        canEdit={canEdit}
        canModify={canModify}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
};

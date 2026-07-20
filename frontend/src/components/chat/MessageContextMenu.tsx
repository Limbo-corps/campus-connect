"use client";

import React from "react";
import { CornerUpLeft, Copy, Pencil, Trash2 } from "lucide-react";
import { Dropdown } from "@heroui/react";
import type { LocalMessage } from "@/hooks/useMessages";

interface MessageContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  message: LocalMessage;
  canEdit: boolean;
  canModify: boolean;
  onReply?: (message: LocalMessage) => void;
  onEdit?: (message: LocalMessage) => void;
  onDelete?: (message: LocalMessage) => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  position,
  onClose,
  message,
  canEdit,
  canModify,
  onReply,
  onEdit,
  onDelete,
}) => {
  if (!position) return null;

  const handleAction = (key: React.Key) => {
    const actionKey = String(key);

    switch (actionKey) {
      case "reply":
        onReply?.(message);
        break;
      case "copy":
        if (message.content) navigator.clipboard.writeText(message.content);
        break;
      case "edit":
        onEdit?.(message);
        break;
      case "delete":
        onDelete?.(message);
        break;
    }
    onClose();
  };

  return (
    <>
      {/* Overlay to handle closing on click/context-menu outside */}
      <div
        className="fixed inset-0 z-50 bg-transparent"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      <Dropdown
        isOpen={Boolean(position)}
        onOpenChange={(open) => !open && onClose()}
      >
        {/* Anchor point positioned where the user right-clicked */}
        <Dropdown.Trigger
          style={{
            position: "fixed",
            top: position.y,
            left: position.x,
          }}
          className="fixed z-50 h-0 w-0 border-none p-0 opacity-0 pointer-events-none"
        >
          <span className="sr-only">Open context menu</span>
        </Dropdown.Trigger>

        <Dropdown.Popover
          placement="bottom start"
          className="min-w-[190px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl backdrop-blur-xl z-[51]"
        >
          <Dropdown.Menu
            onAction={handleAction}
            className="flex flex-col gap-1 select-none"
          >
            {onReply && (
              <Dropdown.Item
                id="reply"
                textValue="Reply"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] cursor-pointer transition-colors"
              >
                <CornerUpLeft size={16} />
                <span>Reply</span>
              </Dropdown.Item>
            )}

            {message.content && (
              <Dropdown.Item
                id="copy"
                textValue="Copy Text"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] cursor-pointer transition-colors"
              >
                <Copy size={16} />
                <span>Copy Text</span>
              </Dropdown.Item>
            )}

            {canEdit && onEdit && (
              <Dropdown.Item
                id="edit"
                textValue="Edit Message"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] cursor-pointer transition-colors"
              >
                <Pencil size={16} />
                <span>Edit Message</span>
              </Dropdown.Item>
            )}

            {canModify && onDelete && (
              <Dropdown.Item
                id="delete"
                textValue="Delete Message"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[var(--danger-foreground)] cursor-pointer transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete Message</span>
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </>
  );
};

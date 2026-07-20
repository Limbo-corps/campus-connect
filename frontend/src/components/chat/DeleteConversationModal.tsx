"use client";

import React from "react";
import { AlertDialog, Button } from "@heroui/react";

interface DeleteConversationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conversationName: string;
  isGroup?: boolean;
  onConfirm: () => Promise<void> | void;
}

export function DeleteConversationModal({
  isOpen,
  onOpenChange,
  conversationName,
  isGroup = false,
  onConfirm,
}: DeleteConversationModalProps) {
  const handleConfirm = async () => {
    onOpenChange(false);
    await onConfirm();
  };

  return (
    <AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Backdrop variant="blur">
        <AlertDialog.Container placement="center" size="sm">
          <AlertDialog.Dialog className="border border-[--surface-secondary] bg-[--surface] shadow-2xl">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading className="text-[--foreground]">
                {isGroup ? "Delete Group" : "Delete Conversation"}
              </AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="text-xs text-[--muted]">
              <p>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[--foreground]">
                  &quot;{conversationName}&quot;
                </span>
                ? This action cannot be undone and all message history will be
                lost.
              </p>
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button
                slot="close"
                variant="ghost"
                className="text-xs text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="text-xs"
                onPress={handleConfirm}
              >
                Delete
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

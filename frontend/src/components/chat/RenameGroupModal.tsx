"use client";

import React, { useState } from "react";
import { Modal, Button, Input, Label } from "@heroui/react";

interface RenameGroupModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentName: string;
  onRename: (newName: string) => Promise<void> | void;
}

export function RenameGroupModal({
  isOpen,
  onOpenChange,
  currentName,
  onRename,
}: RenameGroupModalProps) {
  const [name, setName] = useState(currentName);
  const [prevName, setPrevName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state during render when currentName prop changes (React pattern)
  if (prevName !== currentName) {
    setPrevName(currentName);
    setName(currentName);
  }

  const handleSubmit = async (e: React.FormEvent, close: () => void) => {
    e.preventDefault();
    if (!name.trim() || name === currentName || isLoading) return;

    try {
      setIsLoading(true);
      await onRename(name.trim());
      close();
    } catch (error) {
      console.error("Failed to rename group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop variant="blur" className="bg-black/40">
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="bg-[--surface] border border-[--surface-secondary] rounded-2xl p-6 shadow-2xl">
            {({ close }) => (
              <form onSubmit={(e) => handleSubmit(e, close)}>
                <Modal.CloseTrigger />
                
                <Modal.Header className="mb-4">
                  <Modal.Heading className="text-lg font-bold text-[--foreground]">
                    Rename Group
                  </Modal.Heading>
                </Modal.Header>

                <Modal.Body className="space-y-3 mb-6">
                  <Label htmlFor="group-name" className="text-xs font-semibold text-[--muted]">
                    Group Name
                  </Label>
                  <Input
                    id="group-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter new group name"
                    autoFocus
                    className="w-full rounded-lg border border-[--surface-secondary] bg-[--surface-secondary]/50 px-3 py-2 text-sm text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--accent]"
                  />
                </Modal.Body>

                <Modal.Footer className="flex items-center justify-end gap-2">
                  <Button
                    slot="close"
                    variant="ghost"
                    size="sm"
                    isDisabled={isLoading}
                    className="text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isPending={isLoading}
                    isDisabled={!name.trim() || name === currentName}
                  >
                    Save
                  </Button>
                </Modal.Footer>
              </form>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
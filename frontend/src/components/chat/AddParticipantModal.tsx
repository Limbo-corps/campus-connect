"use client";

import React, { useMemo, useState } from "react";
import { Modal, Avatar, Button, Skeleton, Spinner } from "@heroui/react";
import { Check, Search, UserPlus, X } from "lucide-react";

import { useMutuals } from "@/hooks/useFollow";
import { addParticipant } from "@/lib/chat/api";
import { userDisplayName, userInitials } from "@/lib/chat/format";
import type { Conversation, User } from "@/types";

// `User` from the follow graph is a structural superset of `ChatUser`, so the
// format helpers accept it directly.

interface AddParticipantModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  onAdded: () => void;
}

export default function AddParticipantModal({
  isOpen,
  onOpenChange,
  conversation,
  onAdded,
}: AddParticipantModalProps) {
  const { mutuals, loading } = useMutuals();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingIds = useMemo(
    () => new Set(conversation.participants_detail?.map((p) => p.user.id)),
    [conversation],
  );

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mutuals.filter((u) => {
      if (existingIds.has(u.id)) return false;
      if (!q) return true;
      return (
        userDisplayName(u).toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    });
  }, [mutuals, existingIds, query]);

  const toggle = (u: User) =>
    setSelected((prev) =>
      prev.some((x) => x.id === u.id)
        ? prev.filter((x) => x.id !== u.id)
        : [...prev, u],
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      for (const u of selected) {
        await addParticipant(conversation.id, u.id);
      }
      onAdded();
      setSelected([]);
      setQuery("");
      onOpenChange(false);
    } catch {
      setError("Could not add everyone. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog className="w-full max-w-sm rounded-2xl border border-[--surface-secondary] bg-[--surface] text-[--foreground] shadow-2xl">
            <Modal.CloseTrigger className="absolute right-4 top-4 rounded-full p-1 text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]">
              <X size={16} />
            </Modal.CloseTrigger>

            <Modal.Header className="pb-2">
              <Modal.Heading className="flex items-center gap-2 text-lg font-bold">
                <UserPlus size={18} className="text-[--accent]" />
                Add people
              </Modal.Heading>
            </Modal.Header>

            <form onSubmit={handleSubmit}>
              <Modal.Body className="space-y-3 px-5 py-2">
                <label className="flex items-center gap-2 rounded-2xl border border-[--surface-secondary] bg-transparent px-3 py-2 focus-within:border-[--accent]/50">
                  <Search size={14} className="text-[--muted]" />
                  <input
                    placeholder="Search people who follow you back..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent text-sm text-[--foreground] outline-none placeholder:text-[--muted]"
                  />
                </label>

                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-1 py-1">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-3 w-28 rounded" />
                      </div>
                    ))
                  ) : candidates.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[--muted]">
                      No one left to add.
                    </div>
                  ) : (
                    candidates.map((u) => {
                      const isSel = selected.some((x) => x.id === u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggle(u)}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border px-2 py-1.5 transition-all ${
                            isSel
                              ? "border-[--accent]/30 bg-[--accent]/5"
                              : "border-transparent hover:bg-[--surface-secondary]/40"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar size="sm" color="accent" className="shrink-0">
                              {u.avatar_url ? (
                                <Avatar.Image src={u.avatar_url} alt={u.username} />
                              ) : (
                                <Avatar.Fallback className="text-xs font-bold">
                                  {userInitials(u)}
                                </Avatar.Fallback>
                              )}
                            </Avatar>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-xs font-bold text-[--foreground]">
                                {userDisplayName(u as unknown as User)}
                              </span>
                              <span className="truncate text-[10px] text-[--muted]">
                                @{u.username}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              isSel
                                ? "border-[--accent] bg-[--accent] text-[--accent-foreground]"
                                : "border-[--surface-secondary]"
                            }`}
                          >
                            {isSel && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {error && (
                  <p className="text-center text-xs font-medium text-danger">
                    {error}
                  </p>
                )}
              </Modal.Body>

              <Modal.Footer className="flex justify-end gap-2 border-t border-[--surface-secondary] px-5 pb-4 pt-3">
                <Button
                  slot="close"
                  size="sm"
                  variant="ghost"
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  isDisabled={selected.length === 0 || submitting}
                  className="rounded-xl bg-[--accent] text-xs font-bold text-[--accent-foreground] hover:opacity-95"
                >
                  {submitting ? <Spinner size="sm" /> : `Add ${selected.length || ""}`}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

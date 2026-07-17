"use client";

import React, { useState, useMemo } from "react";
import type { Conversation, User } from "@/types";
import { Modal, Avatar, Button, Skeleton, Spinner } from "@heroui/react";
import { UserPlus, Users, Check, X, Search } from "lucide-react";
import { useMutuals } from "@/hooks/useFollow";
import { createConversation } from "@/lib/chat/api";

interface AddDirectMessageModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Called with the created (or reused) conversation. */
  onCreated: (conversation: Conversation) => void;
}

export default function AddDirectMessageModal({
  isOpen,
  onOpenChange,
  onCreated,
}: AddDirectMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // You can only DM / group people who follow you back (mutuals).
  const { mutuals, loading } = useMutuals();

  const getUserDisplayName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
    }
    return user.username;
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return mutuals;
    return mutuals.filter((user) => {
      const fullName = getUserDisplayName(user).toLowerCase();
      const userName = user.username.toLowerCase();
      return fullName.includes(query) || userName.includes(query);
    });
  }, [searchQuery, mutuals]);

  const toggleUserSelection = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const isGroupMode = selectedUsers.length > 1;

  const resetAndClose = () => {
    setSelectedUsers([]);
    setGroupName("");
    setSearchQuery("");
    setError(null);
    onOpenChange(false);
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0 || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const conversation = await createConversation(
        selectedUsers.map((u) => u.id),
        isGroupMode ? groupName.trim() || undefined : undefined,
      );
      onCreated(conversation);
      resetAndClose();
    } catch {
      setError("Could not start the conversation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog className="border border-[--surface-secondary] bg-[--surface] text-[--foreground] shadow-2xl rounded-2xl w-full max-w-sm">
            <Modal.CloseTrigger className="absolute right-4 top-4 rounded-full p-1 text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground] transition-colors">
              <X size={16} />
            </Modal.CloseTrigger>

            <Modal.Header className="pb-2">
              <Modal.Heading className="text-lg font-bold flex items-center gap-2">
                {isGroupMode ? (
                  <Users size={18} className="text-[--accent]" />
                ) : (
                  <UserPlus size={18} className="text-[--accent]" />
                )}
                {isGroupMode ? "New Group Chat" : "New Message"}
              </Modal.Heading>
            </Modal.Header>

            <form onSubmit={handleActionSubmit}>
              <Modal.Body className="px-5 py-2 space-y-3">
                {isGroupMode && (
                  <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[--muted]">
                      Group Title (Optional)
                    </label>
                    <input
                      placeholder="e.g., Hackathon Cohort, Lab Partners"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full rounded-2xl border border-[--surface-secondary] bg-transparent px-3 py-2 text-sm text-[--foreground] outline-none placeholder:text-[--muted] focus:border-[--accent]/50"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 rounded-2xl border border-[--surface-secondary] bg-transparent px-3 py-2 focus-within:border-[--accent]/50">
                    <Search size={14} className="text-[--muted]" />
                    <input
                      placeholder="Search people who follow you back..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-sm text-[--foreground] outline-none placeholder:text-[--muted]"
                    />
                  </label>
                </div>

                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-1.5 bg-[--surface-secondary]/20 border border-[--surface-secondary]/50 rounded-xl max-h-20 overflow-y-auto">
                    {selectedUsers.map((user) => (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => toggleUserSelection(user)}
                        className="flex items-center gap-1 bg-[--accent]/10 hover:bg-[--accent]/20 border border-[--accent]/20 text-[--foreground] font-semibold text-[10px] px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                      >
                        <span>{getUserDisplayName(user)}</span>
                        <X size={10} className="text-[--accent]" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 h-auto max-h-64 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[--muted] block px-1 mt-1">
                    Mutual Follows
                  </label>

                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1 px-1"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-24 rounded" />
                            <Skeleton className="h-2.5 w-16 rounded" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center text-xs text-[--muted] py-8">
                      No mutual follows yet. When you and a classmate follow each
                      other, they&apos;ll show up here so you can chat.
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedUsers.some(
                        (u) => u.id === user.id,
                      );
                      const displayTitle = getUserDisplayName(user);
                      const initials =
                        `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
                        user.username[0].toUpperCase();

                      return (
                        <div
                          key={user.id}
                          onClick={() => toggleUserSelection(user)}
                          className={`flex items-center justify-between py-1.5 px-2 rounded-xl cursor-pointer border transition-all ${
                            isSelected
                              ? "bg-[--accent]/5 border-[--accent]/30"
                              : "bg-transparent border-transparent hover:bg-[--surface-secondary]/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              size="sm"
                              color="accent"
                              className="ring-1 ring-[--surface-secondary] shrink-0"
                            >
                              {user.avatar_url ? (
                                <Avatar.Image
                                  src={user.avatar_url}
                                  alt={user.username}
                                />
                              ) : (
                                <Avatar.Fallback className="text-xs font-bold">
                                  {initials}
                                </Avatar.Fallback>
                              )}
                            </Avatar>

                            <div className="min-w-0 flex flex-col text-left">
                              <span className="text-xs font-bold text-[--foreground] leading-tight truncate">
                                {displayTitle}
                              </span>
                              <span className="text-[10px] text-[--muted] truncate">
                                @{user.username}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                              isSelected
                                ? "bg-[--accent] border-[--accent] text-[--accent-foreground]"
                                : "border-[--surface-secondary] bg-transparent"
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
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

              <Modal.Footer className="border-t border-[--surface-secondary] pt-3 pb-4 flex justify-end gap-2 px-5">
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
                  isDisabled={selectedUsers.length === 0 || submitting}
                  className={`rounded-xl text-xs font-bold transition-all ${
                    selectedUsers.length > 0
                      ? "bg-[--accent] text-[--accent-foreground] hover:opacity-95"
                      : "bg-[--surface-secondary] text-[--muted] cursor-not-allowed"
                  }`}
                >
                  {submitting ? (
                    <Spinner size="sm" />
                  ) : isGroupMode ? (
                    "Create Group"
                  ) : (
                    "Chat Now"
                  )}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

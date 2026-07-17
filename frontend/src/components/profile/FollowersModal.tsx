"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { User } from "@/types";
import { Modal, Avatar, Button, Typography, Skeleton } from "@heroui/react";
import { UserCheck, UserPlus, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useFollowers,
  useFollowing,
  followUser,
  unfollowUser,
} from "@/hooks/useFollow";

interface FollowersModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
}

export default function FollowersModal({
  isOpen,
  onOpenChange,
  userId,
}: FollowersModalProps) {
  const { user: currentUser } = useAuth();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { followers, loading, mutate: mutateFollowers } = useFollowers(userId);
  const { following: myFollowingList, mutate: mutateMyFollowing } =
    useFollowing(currentUser?.id);

  const isUserFollowedByMe = (targetId: string) => {
    return myFollowingList.some((u) => String(u.id) === String(targetId));
  };

  const handleFollowToggle = async (targetUser: User) => {
    if (actionLoadingId) return;
    setActionLoadingId(targetUser.id);

    const isCurrentlyFollowing = isUserFollowedByMe(targetUser.id);

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(targetUser.id);
      } else {
        await followUser(targetUser.id);
      }
      await Promise.all([mutateMyFollowing(), mutateFollowers()]);
    } catch (err) {
      console.error("Failed follower relationship toggle:", err);
    } finally {
      setActionLoadingId(null);
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
              <Modal.Heading className="text-lg font-bold">
                Followers
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="px-5 py-2">
              {/* Keep the list vertically scrollable without horizontal overflow */}
              <div className="flex flex-col gap-3 h-auto max-h-87.5 overflow-y-auto overflow-x-hidden pr-1">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3 w-24 rounded" />
                          <Skeleton className="h-2.5 w-16 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                  ))
                ) : followers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[--surface-secondary] text-[--muted]">
                      <Users size={20} />
                    </div>
                    <Typography.Heading
                      level={4}
                      className="text-sm font-semibold"
                    >
                      No followers yet
                    </Typography.Heading>
                    <Typography.Paragraph
                      size="xs"
                      color="muted"
                      className="mt-1 max-w-50"
                    >
                      When classmates follow this user, they will appear here.
                    </Typography.Paragraph>
                  </div>
                ) : (
                  followers.map((user) => {
                    const isSelf = currentUser?.id === user.id;
                    const followingThem = isUserFollowedByMe(user.id);
                    const initials =
                      `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
                      user.username[0].toUpperCase();

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between py-1.5 hover:bg-[--surface-secondary]/20 rounded-lg px-2 transition-colors w-full"
                      >
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={() => onOpenChange(false)}
                          className="flex items-center gap-3 group outline-none min-w-0"
                        >
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
                            <span className="text-xs font-bold text-[--foreground] group-hover:text-[--accent] transition-colors leading-tight truncate">
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="text-[10px] text-[--muted] truncate">
                              @{user.username}
                            </span>
                          </div>
                        </Link>

                        {!isSelf && currentUser && (
                          <Button
                            variant={followingThem ? "secondary" : "primary"}
                            size="sm"
                            isPending={actionLoadingId === user.id}
                            onPress={() => handleFollowToggle(user)}
                            className="h-8 rounded-full text-[10px] font-bold px-3 shrink-0"
                          >
                            {followingThem ? (
                              <span className="flex items-center gap-1">
                                <UserCheck size={11} />
                                Following
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <UserPlus size={11} />
                                Follow
                              </span>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Modal.Body>

            <Modal.Footer className="border-t border-[--surface-secondary] pt-3 pb-4">
              <Button
                slot="close"
                size="sm"
                variant="ghost"
                className="rounded-xl text-xs font-semibold"
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

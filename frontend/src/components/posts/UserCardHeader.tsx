"use client";

import { Avatar, Chip, Dropdown } from "@heroui/react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link"; // Imported Next.js Link
import type { Post } from "@/types";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface UserCardHeaderProps {
  post: Post;
  isOwner: boolean;
  edited: boolean;
  onEdit(): void;
  onDelete(): void;
}

export default function UserCardHeader({
  post,
  isOwner,
  edited,
  onEdit,
  onDelete,
}: UserCardHeaderProps) {
  const profileRoute = `/profile/${post.author}`; // Adjust this route if your user profiles are at '/users/...'

  return (
    <div className="flex items-start justify-between gap-3 pb-2 w-full">
      <div className="flex items-center gap-3">
        {/* Clickable Avatar */}
        <Link
          href={profileRoute}
          className="transition-opacity hover:opacity-85"
        >
          <Avatar size="md" color="accent">
            {post.author_avatar ? (
              <Avatar.Image src={post.author_avatar} alt={post.author} />
            ) : (
              <Avatar.Fallback className="text-sm font-bold">
                {post.author[0].toUpperCase()}
              </Avatar.Fallback>
            )}
          </Avatar>
        </Link>

        <div>
          <div className="flex items-center gap-2">
            {/* Clickable Username */}
            <Link
              href={profileRoute}
              className="text-sm font-semibold text-[--foreground] hover:text-[--accent] hover:underline transition-colors"
            >
              @{post.author}
            </Link>

            {post.campus && (
              <Chip
                size="sm"
                variant="soft"
                color="accent"
                className="text-[10px]"
              >
                {post.campus}
              </Chip>
            )}
          </div>
          <span className="text-xs text-[--muted]">
            {timeAgo(post.created_at)} ago{edited && " · edited"}
          </span>
        </div>
      </div>

      {isOwner && (
        <Dropdown>
          <Dropdown.Trigger className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent shadow-none text-[--muted] transition-all hover:bg-[--surface-secondary] hover:text-[--foreground]">
            <MoreHorizontal size={16} />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu aria-label="Post actions">
              <Dropdown.Item key="edit" onAction={onEdit}>
                <span className="flex items-center gap-2 text-sm text-[--foreground]">
                  <Pencil size={14} /> Edit post
                </span>
              </Dropdown.Item>
              <Dropdown.Item key="delete" onAction={onDelete}>
                <span className="flex items-center gap-2 text-sm text-danger">
                  <Trash2 size={14} /> Delete post
                </span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      )}
    </div>
  );
}

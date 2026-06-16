'use client'

import { type ComponentProps } from 'react'
import { Dropdown, Chip } from '@heroui/react'
import { Activity, Heart, MessageCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useMyPosts } from '@/hooks/usePosts'

/**
 * Lightweight activity feed derived from the user's own posts — real data,
 * no faked notifications. Surfaces likes/comments your posts have received.
 */
export default function NotificationsBell(
  { placement = 'bottom end', triggerClassName }: { placement?: string; triggerClassName?: string } = {},
) {
  const { posts } = useMyPosts()

  const liked = posts.filter(p => p.likes_count > 0)
  const totalLikes = posts.reduce((acc, p) => acc + p.likes_count, 0)
  const count = Math.min(totalLikes, 99)

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Notifications"
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent shadow-none transition-colors ${
          triggerClassName ?? 'text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]'
        }`}
      >
        <Activity size={18} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[--accent-foreground] px-1 text-[9px] font-bold text-[--accent] ring-1 ring-[--accent]">
            {count}
          </span>
        )}
      </Dropdown.Trigger>

      <Dropdown.Popover placement={placement as ComponentProps<typeof Dropdown.Popover>['placement']} className="w-72">
        <Dropdown.Menu aria-label="Activity">
          <Dropdown.Item key="header" className="pointer-events-none opacity-100">
            <div className="flex items-center justify-between py-0.5">
              <span className="flex items-center gap-1.5 text-sm font-bold text-[--foreground]">
                <Sparkles size={14} className="text-[--accent]" /> Your activity
              </span>
              {totalLikes > 0 && (
                <Chip size="sm" color="accent" variant="soft" className="text-[10px]">
                  {totalLikes} ❤️
                </Chip>
              )}
            </div>
          </Dropdown.Item>

          {liked.length === 0 ? (
            <Dropdown.Item key="empty" className="pointer-events-none opacity-100">
              <div className="flex flex-col items-center gap-1 py-4 text-center">
                <span className="text-2xl">🦗</span>
                <p className="text-xs font-medium text-[--foreground]">Crickets… for now</p>
                <p className="text-[11px] text-[--muted]">Post something and watch the love roll in</p>
              </div>
            </Dropdown.Item>
          ) : (
            liked.slice(0, 5).map(p => (
              <Dropdown.Item key={p.id}>
                <Link href="/profile" className="flex w-full items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                    <Heart size={13} className="fill-rose-500 text-rose-500" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-[--foreground]">
                      {p.likes_count} {p.likes_count === 1 ? 'like' : 'likes'} on your post
                    </span>
                    <span className="block truncate text-[11px] text-[--muted]">
                      &ldquo;{p.content}&rdquo;
                    </span>
                  </span>
                </Link>
              </Dropdown.Item>
            ))
          )}

          <Dropdown.Item key="all">
            <Link href="/profile" className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[--accent]">
              <MessageCircle size={13} /> View all your posts
            </Link>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

'use client'

import { useState } from 'react'
import { Card, Skeleton, EmptyState, Typography, Alert, ScrollShadow } from '@heroui/react'
import { Flame, TrendingUp, GraduationCap } from 'lucide-react'
import { usePosts } from '@/hooks/usePosts'
import { useCampuses } from '@/hooks/useCampuses'
import PostCard from '@/components/posts/PostCard'
import CreatePostModal from '@/components/posts/CreatePostModal'
import { useAuth } from '@/contexts/AuthContext'
import CampusEmblem from '@/components/campus/CampusEmblem'
import InlineSearch from '@/components/layout/InlineSearch'
import Link from 'next/link'

export default function FeedPage() {
  const { user } = useAuth()
  const { posts, loading, mutate } = usePosts()
  const { campuses } = useCampuses()
  const [query, setQuery] = useState('')

  const userCampus = campuses.find(c => c.id === (user as unknown as { campus?: string })?.campus)
  const totalStudents = campuses.reduce((acc, c) => acc + c.students_count, 0)
  const topCampuses = [...campuses].sort((a, b) => b.students_count - a.students_count).slice(0, 3)

  const filteredPosts = query
    ? posts.filter(p =>
        p.content.toLowerCase().includes(query.toLowerCase()) ||
        p.author.toLowerCase().includes(query.toLowerCase())
      )
    : posts

  return (
    <div className="grid grid-cols-12 gap-4">

      {/* ── Main feed column ── */}
      <section className="col-span-12 space-y-3 xl:col-span-8">
        {/* Slim feed toolbar — title + live count + collapsible search */}
        <div className="flex items-center justify-between gap-2 px-0.5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[--foreground]">
            {query ? `Results for "${query}"` : 'Latest posts'}
            <span className="rounded-full bg-[--accent]/15 px-2 py-0.5 text-[10px] font-semibold text-[--accent]">
              {filteredPosts.length}
            </span>
          </h2>
          <InlineSearch
            value={query}
            onChange={setQuery}
            placeholder="Search the campus chatter…"
            label="Search posts"
          />
        </div>

        <CreatePostModal onSuccess={mutate} />

        {/* No campus alert */}
        {!userCampus && !loading && (
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>You&apos;re flying solo 🛸</Alert.Title>
              <Alert.Description>
                <Link href="/campus" className="underline">Join a campus</Link> to unlock local posts and find your people.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border border-[--surface-secondary]">
              <Card.Content className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-28 rounded" />
                    <Skeleton className="h-2.5 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </Card.Content>
            </Card>
          ))
        ) : filteredPosts.length === 0 ? (
          <EmptyState className="flex flex-col items-center rounded-xl border border-dashed border-[--surface-secondary] bg-[--surface] py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-pink-100 to-fuchsia-100 dark:from-pink-900/30 dark:to-fuchsia-900/30">
              <Flame size={28} className="text-[--accent]" />
            </div>
            <Typography.Heading level={4} className="text-[--foreground]">
              {query ? 'Nada. Zilch. 🤷' : 'Be the main character ✨'}
            </Typography.Heading>
            <Typography.Paragraph size="sm" color="muted" className="mt-1 max-w-xs">
              {query ? 'No posts match that — try different words.' : 'Nobody has posted yet. Break the ice and start the conversation.'}
            </Typography.Paragraph>
          </EmptyState>
        ) : (
          <ScrollShadow hideScrollBar className="space-y-3">
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={post} onMutate={mutate} />
            ))}
          </ScrollShadow>
        )}
      </section>

      {/* ── Right widgets rail (xl+) ── */}
      <aside className="col-span-12 xl:col-span-4">
        <div className="sticky top-6 space-y-3">

          {/* Network pulse — bento of network-wide numbers */}
          <Card className="overflow-hidden border border-[--surface-secondary] shadow-sm">
            <Card.Content className="p-2">
              <p className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[--muted]">
                Network pulse
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="col-span-2 flex items-center justify-between rounded-xl bg-linear-to-br from-[--accent]/15 to-[--accent]/5 p-3">
                  <div>
                    <p className="text-2xl font-extrabold leading-none text-[--foreground]">
                      {totalStudents.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-[--muted]">students connected</p>
                  </div>
                  <GraduationCap size={26} className="text-[--accent]/70" />
                </div>
                <div className="rounded-xl bg-[--surface-secondary] p-3">
                  <p className="text-lg font-bold leading-none text-[--foreground]">{campuses.length}</p>
                  <p className="mt-1 text-[10px] text-[--muted]">campuses</p>
                </div>
                <div className="rounded-xl bg-[--surface-secondary] p-3">
                  <p className="text-lg font-bold leading-none text-[--foreground]">{posts.length}</p>
                  <p className="mt-1 text-[10px] text-[--muted]">posts live</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Biggest campuses — ranked leaderboard */}
          {topCampuses.length > 0 && (
            <Card className="border border-[--surface-secondary] shadow-sm">
              <Card.Header className="pb-2">
                <Card.Title className="flex items-center gap-1.5 text-sm">
                  <TrendingUp size={14} className="text-[--accent]" /> Biggest campuses
                </Card.Title>
              </Card.Header>
              <Card.Content className="space-y-2 pt-0">
                {topCampuses.map((campus, i) => (
                  <div key={campus.id} className="flex items-center gap-2.5">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                        i === 0
                          ? 'bg-[--accent] text-[--accent-foreground]'
                          : 'bg-[--surface-secondary] text-[--muted]'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <CampusEmblem campus={campus} className="size-8 shrink-0 rounded-md" textClassName="text-[10px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[--foreground]">{campus.name}</p>
                      <p className="text-[10px] text-[--muted]">{campus.students_count.toLocaleString()} students</p>
                    </div>
                  </div>
                ))}
              </Card.Content>
            </Card>
          )}
        </div>
      </aside>
    </div>
  )
}

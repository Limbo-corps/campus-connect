'use client'

import {
  Card, Avatar, Chip, Skeleton, Separator,
  ProgressBar, Tooltip, EmptyState, Typography, Button, Breadcrumbs, Accordion,
} from '@heroui/react'
import { MapPin, Mail, BookOpen, Edit3, Heart, FileText, TrendingUp, Users, Award, Calendar, GraduationCap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyPosts } from '@/hooks/usePosts'
import { useCampuses } from '@/hooks/useCampuses'
import PostCard from '@/components/posts/PostCard'
import CreatePostModal from '@/components/posts/CreatePostModal'
import EditProfileModal from '@/components/profile/EditProfileModal'
import { CAMPUS_HERO, IMG_FADE } from '@/lib/banners'
import { getTemplate } from '@/lib/templates'
import CampusEmblem from '@/components/campus/CampusEmblem'
import { useState } from 'react'
import Link from 'next/link'

function relativeDate(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { posts, loading, mutate } = useMyPosts()
  const { campuses } = useCampuses()
  const [editOpen, setEditOpen] = useState(false)

  const template = getTemplate(user?.profile_template)

  const userCampus = campuses.find(c => c.id === (user as unknown as { campus?: string })?.campus)
  const totalLikes = posts.reduce((acc, p) => acc + p.likes_count, 0)
  const mostLikedPost = posts.length > 0
    ? posts.reduce((a, b) => (a.likes_count > b.likes_count ? a : b))
    : null

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.username[0].toUpperCase()
    : '?'

  const completionSteps = [
    { done: !!(user?.first_name && user?.last_name), label: 'Full name' },
    { done: !!user?.bio, label: 'Bio' },
    { done: !!user?.email, label: 'Email' },
    { done: !!userCampus, label: 'Campus' },
    { done: posts.length > 0, label: 'First post' },
  ]
  const completionPct = Math.round((completionSteps.filter(s => s.done).length / completionSteps.length) * 100)

  const BADGES = [
    { emoji: '🎓', label: 'Student', desc: 'Joined Campus Connect', unlocked: true },
    { emoji: '✍️', label: 'Author', desc: 'Created your first post', unlocked: posts.length > 0 },
    { emoji: '❤️', label: 'Liked', desc: 'Received your first like', unlocked: totalLikes > 0 },
    { emoji: '🏛️', label: 'Campus', desc: 'Joined a campus', unlocked: !!userCampus },
    { emoji: '🔥', label: 'Trending', desc: 'Received 10+ likes total', unlocked: totalLikes >= 10 },
  ]

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <Breadcrumbs>
        <Breadcrumbs.Item href="/feed">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item>Profile</Breadcrumbs.Item>
      </Breadcrumbs>

    <div className="grid grid-cols-12 gap-4">

      {/* ── Main column ── */}
      <div className="col-span-12 space-y-4 lg:col-span-8">

        {/* Profile card */}
        <Card className="border border-[--surface-secondary] shadow-sm">
          {/* Banner — clean campus photo, subtle bottom fade to blend into card */}
          <div
            className="relative h-36 overflow-hidden rounded-t-3xl bg-cover bg-center"
            style={{ backgroundImage: `${IMG_FADE}, url('${template.banner}')` }}
          />

          <Card.Content className="relative pb-5">
            {/* Avatar + Edit button row */}
            <div className="-mt-12 flex items-end justify-between">
              {/* Avatar with online dot */}
              <div className="relative">
                <Avatar color="accent" className="size-20 ring-4 ring-[--surface] shadow-xl">
                  {user?.avatar_url
                    ? <Avatar.Image src={user.avatar_url} alt={user.username ?? ''} />
                    : <Avatar.Fallback className="text-3xl font-extrabold">{initials}</Avatar.Fallback>
                  }
                </Avatar>
                <span className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-full border-2 border-[--surface] bg-emerald-500 shadow-sm" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onPress={() => setEditOpen(true)}
                className="mb-1 gap-1.5 rounded-full border-[--surface-secondary] text-xs font-semibold"
              >
                <Edit3 size={12} />
                Edit profile
              </Button>
            </div>

            {/* Name + meta */}
            <div className="mt-3">
              <Typography.Heading level={2} weight="bold" className="text-[--foreground]">
                {user?.first_name} {user?.last_name}
              </Typography.Heading>
              <Typography.Paragraph size="sm" color="muted" className="mt-0.5">
                @{user?.username}
              </Typography.Paragraph>
              {user?.tagline && (
                <p className="mt-1.5 text-sm font-medium text-[--foreground]">{user.tagline}</p>
              )}
            </div>

            {/* About accordion */}
            <Accordion variant="default" hideSeparator className="mt-2">
              <Accordion.Item id="about">
                <Accordion.Heading>
                  <Accordion.Trigger className="py-1.5 text-xs font-semibold text-[--muted]">
                    About
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="pb-2 pt-0">
                    {user?.bio
                      ? <Typography.Paragraph size="sm" className="leading-relaxed text-[--foreground]">{user.bio}</Typography.Paragraph>
                      : <Typography.Paragraph size="sm" className="italic text-[--muted]">No bio yet — click Edit profile to add one.</Typography.Paragraph>
                    }
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {userCampus && (
                <span className="flex items-center gap-1.5 text-xs text-[--muted]">
                  <BookOpen size={13} className="text-[--accent]" />
                  {userCampus.name}{userCampus.city ? ` · ${userCampus.city}` : ''}
                </span>
              )}
              {user?.email && (
                <span className="flex items-center gap-1.5 text-xs text-[--muted]">
                  <Mail size={13} />
                  {user.email}
                </span>
              )}
            </div>

            <Separator className="my-4" />

            {/* Stats — flat LinkedIn style */}
            <div className="flex divide-x divide-[--surface-secondary]">
              {[
                { icon: FileText, label: 'Posts', value: posts.length, color: 'text-violet-400' },
                { icon: Heart, label: 'Likes', value: totalLikes, color: 'text-rose-400' },
                { icon: GraduationCap, label: 'Campus', value: userCampus ? userCampus.name : '—', color: 'text-emerald-400' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex flex-1 flex-col items-center gap-1 px-4 first:pl-0 last:pr-0">
                  <Icon size={16} className={color} />
                  <span className={`text-xl font-bold text-[--foreground] ${typeof value === 'string' ? 'text-sm' : ''}`}>
                    {value}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-[--muted]">{label}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Profile completion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Typography.Paragraph size="xs" weight="medium" className="text-[--foreground]">
                  Profile strength
                </Typography.Paragraph>
                <Chip
                  size="sm"
                  variant="soft"
                  color={completionPct === 100 ? 'success' : completionPct >= 60 ? 'warning' : 'default'}
                >
                  {completionPct}%
                </Chip>
              </div>
              <ProgressBar
                value={completionPct}
                aria-label="Profile strength"
                color={completionPct === 100 ? 'success' : 'accent'}
              >
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
              {completionPct < 100 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {completionSteps.filter(s => !s.done).map(s => (
                    <Chip key={s.label} size="sm" variant="soft" color="warning" className="text-[10px]">
                      + {s.label}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Create post */}
        <CreatePostModal onSuccess={mutate} />

        {/* Activity */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Typography.Heading level={3} weight="semibold" className="text-[--foreground]">
              Activity
            </Typography.Heading>
            <Chip size="sm" variant="soft" color="accent">{posts.length} posts</Chip>
          </div>

          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="mb-3 border border-[--surface-secondary]">
                <Card.Content className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-32 rounded" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full rounded" />
                </Card.Content>
              </Card>
            ))
          ) : posts.length === 0 ? (
            <EmptyState className="flex flex-col items-center rounded-xl border border-dashed border-[--surface-secondary] bg-[--surface] py-14 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[--surface-secondary]">
                <TrendingUp size={22} className="text-[--muted]" />
              </div>
              <Typography.Heading level={4} className="text-[--foreground]">No posts yet</Typography.Heading>
              <Typography.Paragraph size="sm" color="muted" className="mt-1">
                Your posts will appear here once you share something.
              </Typography.Paragraph>
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <PostCard key={post.id} post={post} onMutate={mutate} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right sidebar (sticky) ── */}
      <aside className="col-span-12 lg:col-span-4">
        <div className="sticky top-20 space-y-3">

          {/* Campus card */}
          {userCampus ? (
            <Card className="border border-[--surface-secondary] shadow-sm">
              <div
                className="h-12 rounded-t-3xl bg-cover bg-center"
                style={{ backgroundImage: `${IMG_FADE}, url('${CAMPUS_HERO}')` }}
              />
              <Card.Header className="gap-1 pt-3">
                <div className="flex items-start justify-between">
                  <CampusEmblem
                    campus={userCampus}
                    className="size-11 rounded-lg"
                    textClassName="text-lg"
                  />
                  <Chip size="sm" color="success" variant="soft">Member</Chip>
                </div>
                <Card.Title className="mt-1 font-bold">{userCampus.name}</Card.Title>
                {(userCampus.city || userCampus.state) && (
                  <Card.Description className="flex items-center gap-1 text-xs">
                    <MapPin size={11} />
                    {[userCampus.city, userCampus.state].filter(Boolean).join(', ')}
                  </Card.Description>
                )}
                {userCampus.description && (
                  <Card.Description className="line-clamp-3 text-xs leading-relaxed">
                    {userCampus.description}
                  </Card.Description>
                )}
              </Card.Header>
              <Card.Footer className="border-t border-[--surface-secondary] pt-3">
                <Users size={12} className="mr-1.5 text-[--muted]" />
                <span className="text-xs text-[--muted]">{userCampus.students_count.toLocaleString()} students</span>
              </Card.Footer>
            </Card>
          ) : (
            <Card className="border border-dashed border-[--surface-secondary] shadow-sm">
              <Card.Header className="items-center text-center">
                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[--surface-secondary]">
                  <BookOpen size={22} className="text-[--muted]" />
                </div>
                <Card.Title>No campus yet</Card.Title>
                <Card.Description>Join a campus to connect with students near you.</Card.Description>
              </Card.Header>
              <Card.Footer className="justify-center">
                <Link href="/campus" className="w-full">
                  <Button fullWidth className="bg-[--accent] text-[--accent-foreground]" size="sm">
                    Browse Campuses
                  </Button>
                </Link>
              </Card.Footer>
            </Card>
          )}

          {/* Badges with Tooltip */}
          <Card className="border border-[--surface-secondary] shadow-sm">
            <Card.Header className="pb-1">
              <Card.Title className="text-xs uppercase tracking-wider text-[--muted]">Badges</Card.Title>
            </Card.Header>
            <Card.Content className="pt-1">
              <div className="grid grid-cols-5 gap-1.5">
                {BADGES.map(({ emoji, label, desc, unlocked }) => (
                  <Tooltip key={label}>
                    <Tooltip.Trigger>
                      <div className={`flex cursor-default flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all ${
                        unlocked
                          ? 'border-[--accent]/30 bg-[--accent]/8'
                          : 'border-[--surface-secondary] opacity-35 grayscale'
                      }`}>
                        <span className="text-xl leading-none">{emoji}</span>
                        <span className="text-[8px] font-semibold leading-tight text-[--muted]">{label}</span>
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Content showArrow>
                      <Typography.Paragraph size="xs">
                        {unlocked ? `✓ ${desc}` : `🔒 ${desc}`}
                      </Typography.Paragraph>
                    </Tooltip.Content>
                  </Tooltip>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* Highlights — only when there are posts */}
          {posts.length > 0 && (
            <Card className="border border-[--surface-secondary] shadow-sm">
              <Card.Header className="pb-1">
                <Card.Title className="text-xs uppercase tracking-wider text-[--muted]">Highlights</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-3 pt-1">
                {mostLikedPost && (
                  <div className="flex gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                      <Heart size={14} className="text-rose-500" />
                    </div>
                    <div className="min-w-0">
                      <Typography.Paragraph size="xs" weight="medium" className="text-[--foreground]">
                        Most liked post
                      </Typography.Paragraph>
                      <Typography.Paragraph size="xs" color="muted" className="mt-0.5 line-clamp-2 leading-relaxed">
                        {mostLikedPost.content}
                      </Typography.Paragraph>
                      <Typography.Paragraph size="xs" className="mt-0.5 font-semibold text-[--accent]">
                        {mostLikedPost.likes_count} likes
                      </Typography.Paragraph>
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
                    <Award size={14} className="text-pink-500" />
                  </div>
                  <div>
                    <Typography.Paragraph size="xs" weight="medium" className="text-[--foreground]">
                      Total engagement
                    </Typography.Paragraph>
                    <Typography.Paragraph size="xs" color="muted">
                      {totalLikes} like{totalLikes !== 1 ? 's' : ''} across {posts.length} post{posts.length !== 1 ? 's' : ''}
                    </Typography.Paragraph>
                  </div>
                </div>

                {posts[0] && (
                  <div className="flex gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Calendar size={14} className="text-blue-500" />
                    </div>
                    <div>
                      <Typography.Paragraph size="xs" weight="medium" className="text-[--foreground]">
                        Latest post
                      </Typography.Paragraph>
                      <Typography.Paragraph size="xs" color="muted">
                        {relativeDate(posts[0].created_at)}
                      </Typography.Paragraph>
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>
          )}
        </div>
      </aside>
    </div>

    <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  )
}

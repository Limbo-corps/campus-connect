'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Card, Avatar, Dropdown, Chip, ToggleButton, Button, Tooltip, TextArea } from '@heroui/react'
import { Toast } from '@heroui/react'
import { Heart, MessageCircle, MoreHorizontal, Trash2, Share2, Pencil, X } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import type { Post } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import CommentsSection from '@/components/comments/CommentsSection'
import Markdown from '@/components/Markdown'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

interface Props { post: Post; onMutate(): void; detail?: boolean }

export default function PostCard({ post, onMutate, detail = false }: Props) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [commentsOpen, setCommentsOpen] = useState(detail)
  const [content, setContent] = useState(post.content)
  // treat as edited only if updated clearly after creation (>2s) — auto_now and
  // auto_now_add fire near-simultaneously at create time
  const [edited, setEdited] = useState(
    new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 2000
  )
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState(post.content)
  const [savingEdit, setSavingEdit] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isOwner = user?.username === post.author

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  const openEdit = () => {
    setDraft(content)
    setEditOpen(true)
  }

  const saveEdit = async () => {
    const next = draft.trim()
    if (!next || next === content) { setEditOpen(false); return }
    setSavingEdit(true)
    try {
      await api.patch(`/posts/${post.id}/update/`, { content: next })
      setContent(next)
      setEdited(true)
      setEditOpen(false)
      Toast.toast.success('Post updated')
      onMutate()
    } catch {
      Toast.toast.danger('Failed to update post')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleLikeChange = async (selected: boolean) => {
    setLiked(selected)
    setLikesCount(c => c + (selected ? 1 : -1))
    try {
      if (selected) await api.post(`/posts/${post.id}/like/`)
      else await api.delete(`/posts/${post.id}/unlike/`)
    } catch {
      setLiked(!selected)
      setLikesCount(c => c + (selected ? -1 : 1))
    }
  }

  const deletePost = async () => {
    try {
      await api.delete(`/posts/${post.id}/delete/`)
      Toast.toast.success('Post deleted')
      onMutate()
    } catch {
      Toast.toast.danger('Failed to delete post')
    }
  }

  return (
    <>
      <Card className="w-full overflow-hidden border border-[--surface-secondary] shadow-sm transition-shadow hover:shadow-md">

        {/* Header */}
        <Card.Header className="flex items-start justify-between gap-3 pb-2">
          <div className="flex items-center gap-3">
            <Avatar size="md" color="accent">
              {post.author_avatar
                ? <Avatar.Image src={post.author_avatar} alt={post.author} />
                : <Avatar.Fallback className="text-sm font-bold">{post.author[0].toUpperCase()}</Avatar.Fallback>
              }
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[--foreground]">@{post.author}</span>
                {post.campus && (
                  <Chip size="sm" variant="soft" color="accent" className="text-[10px]">
                    {post.campus}
                  </Chip>
                )}
              </div>
              <span className="text-xs text-[--muted]">
                {timeAgo(post.created_at)} ago{edited && ' · edited'}
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
                  <Dropdown.Item key="edit" onAction={openEdit}>
                    <span className="flex items-center gap-2 text-sm text-[--foreground]">
                      <Pencil size={14} /> Edit post
                    </span>
                  </Dropdown.Item>
                  <Dropdown.Item key="delete" onAction={deletePost}>
                    <span className="flex items-center gap-2 text-sm text-danger">
                      <Trash2 size={14} /> Delete post
                    </span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          )}
        </Card.Header>

        {/* Content */}
        <Card.Content className="space-y-2.5 pb-3 pt-0">
          {/* Feeling tag */}
          {post.feeling && (
            <Chip size="sm" variant="soft" color="accent" className="w-fit text-[11px]">{post.feeling}</Chip>
          )}

          {/* Article title */}
          {post.title && (
            detail ? (
              <h1 className="text-xl font-bold text-[--foreground]">{post.title}</h1>
            ) : (
              <Link href={`/posts/${post.id}`}>
                <h2 className="text-lg font-bold leading-snug text-[--foreground] transition-colors hover:text-[--accent]">{post.title}</h2>
              </Link>
            )
          )}

          {/* Body */}
          {content.trim() && (
            post.post_type === 'article' ? (
              detail ? (
                <Markdown>{content}</Markdown>
              ) : (
                <div className="max-h-44 overflow-hidden">
                  <Markdown>{content}</Markdown>
                </div>
              )
            ) : detail ? (
              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-[--foreground]">{content}</p>
            ) : (
              <Link href={`/posts/${post.id}`} className="block">
                <p className="line-clamp-6 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-[--foreground]">{content}</p>
                {content.length > 280 && (
                  <span className="mt-1 inline-block text-xs font-semibold text-[--accent] hover:underline">See more</span>
                )}
              </Link>
            )
          )}

          {/* Read-more for clamped articles */}
          {!detail && post.post_type === 'article' && (
            <Link href={`/posts/${post.id}`} className="inline-block text-xs font-semibold text-[--accent] hover:underline">
              Read article →
            </Link>
          )}

          {/* Image */}
          {post.image_url && (
            detail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.image_url} alt={post.title || 'Post image'} className="w-full rounded-lg border border-[--surface-secondary] object-contain" />
            ) : (
              <Link href={`/posts/${post.id}`} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.image_url} alt={post.title || 'Post image'} className="max-h-112 w-full rounded-lg border border-[--surface-secondary] object-cover" />
              </Link>
            )
          )}
        </Card.Content>

        {/* Like count */}
        {likesCount > 0 && (
          <div className="mx-4 flex items-center gap-1.5 border-t border-[--surface-secondary] py-2">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500">
              <Heart size={9} className="fill-white text-white" />
            </div>
            <span className="text-xs text-[--muted]">{likesCount} like{likesCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Action row — using HeroUI ToggleButton + Button + Tooltip */}
        <Card.Footer className="gap-0 border-t border-[--surface-secondary] p-0">
          <Tooltip>
            <Tooltip.Trigger className="flex flex-1">
              <ToggleButton
                isSelected={liked}
                onChange={handleLikeChange}
                variant="ghost"
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-none rounded-bl-xl py-2 text-xs font-medium transition-colors ${liked ? 'text-rose-500!' : 'text-[--muted]'}`}
              >
                <Heart size={15} className={liked ? 'fill-rose-500! text-rose-500!' : ''} />
                Like
              </ToggleButton>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow>
              {liked ? 'Unlike this post' : 'Like this post'}
            </Tooltip.Content>
          </Tooltip>

          <div className="h-6 w-px bg-[--surface-secondary]" />

          <Tooltip>
            <Tooltip.Trigger className="flex flex-1">
              <Button
                variant="ghost"
                onPress={() => setCommentsOpen(o => !o)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-none py-2 text-xs font-medium transition-colors ${commentsOpen ? 'text-[--accent]' : 'text-[--muted]'}`}
              >
                <MessageCircle size={15} />
                Comment
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow>{commentsOpen ? 'Hide comments' : 'View comments'}</Tooltip.Content>
          </Tooltip>

          <div className="h-6 w-px bg-[--surface-secondary]" />

          <Tooltip>
            <Tooltip.Trigger className="flex flex-1">
              <Button
                variant="ghost"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-none rounded-br-xl py-2 text-xs font-medium text-[--muted]"
                onPress={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`)
                  Toast.toast.success('Post link copied!')
                }}
              >
                <Share2 size={15} />
                Share
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow>Copy link</Tooltip.Content>
          </Tooltip>
        </Card.Footer>

        {/* Inline comments — expand in place, like Instagram / LinkedIn */}
        {commentsOpen && <CommentsSection postId={post.id} expanded={detail} />}
      </Card>

      {mounted && editOpen && createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative z-10 w-full max-w-lg">
            <Card className="overflow-hidden border border-[--surface-secondary] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[--surface-secondary] px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-[--foreground]">
                  <Pencil size={16} className="text-[--accent]" /> Edit post
                </h2>
                <button
                  onClick={() => setEditOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground]"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-4">
                <TextArea
                  value={draft}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
                  rows={5}
                  fullWidth
                  autoFocus
                  className="resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-[--surface-secondary] px-5 py-3">
                <Button variant="ghost" size="sm" onPress={() => setEditOpen(false)} isDisabled={savingEdit}>Cancel</Button>
                <Button
                  size="sm"
                  onPress={saveEdit}
                  isDisabled={savingEdit || !draft.trim() || draft.trim() === content}
                  className="min-w-20 bg-[--accent] text-[--accent-foreground]"
                >
                  {savingEdit ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </Card>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

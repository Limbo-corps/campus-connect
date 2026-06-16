'use client'

import { useState } from 'react'
import { Avatar, Button, TextArea, Spinner, Toast } from '@heroui/react'
import { Send, Pencil, Trash2, Check, X } from 'lucide-react'
import api from '@/lib/api'
import { useComments } from '@/hooks/useComments'
import { useAuth } from '@/contexts/AuthContext'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

interface Props {
  postId: string
  /** when true, never collapse; used on the post detail page */
  expanded?: boolean
}

/**
 * Inline comments — list + add + edit + delete, shown right inside the post card
 * (Instagram / LinkedIn style). Editing uses the existing PATCH endpoint.
 */
export default function CommentsSection({ postId, expanded = false }: Props) {
  const { user } = useAuth()
  const { comments, loading, mutate } = useComments(postId)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const add = async () => {
    if (!draft.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/comments/post/${postId}/create/`, { content: draft })
      setDraft('')
      mutate()
    } catch {
      Toast.toast.danger('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (id: string, content: string) => {
    setEditingId(id)
    setEditDraft(content)
  }

  const saveEdit = async (id: string) => {
    const next = editDraft.trim()
    if (!next) return
    try {
      await api.patch(`/comments/${id}/update/`, { content: next })
      setEditingId(null)
      mutate()
    } catch {
      Toast.toast.danger('Failed to update comment')
    }
  }

  const remove = async (id: string) => {
    try {
      await api.delete(`/comments/${id}/delete/`)
      mutate()
    } catch {
      Toast.toast.danger('Failed to delete comment')
    }
  }

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.username[0].toUpperCase()
    : '?'

  return (
    <div className="border-t border-[--surface-secondary] px-4 py-3">
      {/* Add a comment */}
      <div className="flex items-start gap-2.5">
        <Avatar size="sm" color="accent" className="mt-0.5 shrink-0">
          {user?.avatar_url
            ? <Avatar.Image src={user.avatar_url} alt={user.username ?? ''} />
            : <Avatar.Fallback className="text-[11px] font-bold">{initials}</Avatar.Fallback>}
        </Avatar>
        <div className="flex flex-1 items-end gap-2">
          <TextArea
            placeholder="Add a comment…"
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
            rows={1}
            fullWidth
            className="min-h-9 resize-none text-sm"
          />
          <Button
            size="sm"
            onPress={add}
            isDisabled={!draft.trim() || submitting}
            className="shrink-0 gap-1 bg-[--accent] text-[--accent-foreground]"
          >
            <Send size={13} />
          </Button>
        </div>
      </div>

      {/* Comment list */}
      <div className={`mt-3 flex flex-col gap-3 ${expanded ? '' : 'max-h-96 overflow-y-auto'}`}>
        {loading ? (
          <div className="flex justify-center py-4"><Spinner size="sm" /></div>
        ) : comments.length === 0 ? (
          <p className="py-2 text-center text-xs text-[--muted]">No comments yet — start the conversation 💬</p>
        ) : (
          comments.map(c => {
            const isOwner = user?.username === c.author
            const isEditing = editingId === c.id
            return (
              <div key={c.id} className="flex gap-2.5">
                <Avatar size="sm" color="accent" className="mt-0.5 shrink-0">
                  {c.author_avatar
                    ? <Avatar.Image src={c.author_avatar} alt={c.author} />
                    : <Avatar.Fallback className="text-[11px] font-bold">{c.author[0].toUpperCase()}</Avatar.Fallback>}
                </Avatar>
                <div className="min-w-0 flex-1">
                  {/* bubble */}
                  <div className="rounded-lg rounded-tl-none bg-[--surface-secondary] px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-[--foreground]">@{c.author}</span>
                      <span className="shrink-0 text-[10px] text-[--muted]">
                        {timeAgo(c.created_at)}{c.updated_at !== c.created_at ? ' · edited' : ''}
                      </span>
                    </div>
                    {isEditing ? (
                      <div className="mt-1.5 flex items-end gap-1.5">
                        <TextArea
                          value={editDraft}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDraft(e.target.value)}
                          rows={2}
                          fullWidth
                          autoFocus
                          className="resize-none text-sm"
                        />
                        <Button size="sm" isIconOnly onPress={() => saveEdit(c.id)} isDisabled={!editDraft.trim()} className="bg-[--accent] text-[--accent-foreground]">
                          <Check size={13} />
                        </Button>
                        <Button size="sm" isIconOnly variant="ghost" onPress={() => setEditingId(null)}>
                          <X size={13} />
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-0.5 whitespace-pre-wrap wrap-break-word text-sm leading-snug text-[--foreground]">
                        {c.content}
                      </p>
                    )}
                  </div>
                  {/* owner actions */}
                  {isOwner && !isEditing && (
                    <div className="mt-1 flex gap-3 pl-1">
                      <button onClick={() => startEdit(c.id, c.content)} className="flex items-center gap-1 text-[11px] text-[--muted] hover:text-[--accent]">
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => remove(c.id)} className="flex items-center gap-1 text-[11px] text-[--muted] hover:text-danger">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Card, Button, TextArea, Toast, Avatar, Tabs, Chip } from '@heroui/react'
import {
  ImagePlus, FileText, Smile, X, Globe, Bold, Italic, Heading, List, Quote, Link2, Code,
  Eye, Pencil,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { compressImage } from '@/lib/image'
import Markdown from '@/components/Markdown'
import type { PostType } from '@/types'

interface Props {
  onSuccess(): void
}

const FEELINGS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🎉', label: 'Excited' },
  { emoji: '🙏', label: 'Grateful' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '💪', label: 'Motivated' },
  { emoji: '🤔', label: 'Curious' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '🥳', label: 'Celebrating' },
  { emoji: '📚', label: 'Studying' },
]

export default function CreatePostModal({ onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [postType, setPostType] = useState<PostType>('text')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [feeling, setFeeling] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [articleView, setArticleView] = useState<'write' | 'preview'>('write')
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()

  const fileRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.username[0].toUpperCase()
    : '?'

  const openModal = (type: PostType = 'text') => {
    setPostType(type)
    setOpen(true)
  }

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const closeModal = () => {
    setOpen(false)
    setContent('')
    setTitle('')
    setFeeling('')
    setArticleView('write')
    setPostType('text')
    clearImage()
  }

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      Toast.toast.danger('Image must be under 10 MB')
      return
    }
    // Downscale/compress in the browser so uploads (and later loads) are fast.
    const optimized = await compressImage(file)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(optimized)
    setImagePreview(URL.createObjectURL(optimized))
  }

  // ── markdown toolbar helpers (operate on the article textarea) ──
  const surround = (before: string, after = before, placeholder = 'text') => {
    const ta = bodyRef.current
    if (!ta) return
    const { selectionStart: s, selectionEnd: e, value } = ta
    const sel = value.slice(s, e) || placeholder
    const next = value.slice(0, s) + before + sel + after + value.slice(e)
    setContent(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = s + before.length
      ta.selectionEnd = s + before.length + sel.length
    })
  }
  const linePrefix = (prefix: string) => {
    const ta = bodyRef.current
    if (!ta) return
    const { selectionStart: s, value } = ta
    const lineStart = value.lastIndexOf('\n', s - 1) + 1
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    setContent(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = s + prefix.length
    })
  }

  const TOOLBAR = [
    { icon: Bold, label: 'Bold', run: () => surround('**') },
    { icon: Italic, label: 'Italic', run: () => surround('_') },
    { icon: Heading, label: 'Heading', run: () => linePrefix('## ') },
    { icon: List, label: 'List', run: () => linePrefix('- ') },
    { icon: Quote, label: 'Quote', run: () => linePrefix('> ') },
    { icon: Code, label: 'Code', run: () => surround('`') },
    { icon: Link2, label: 'Link', run: () => surround('[', '](https://)', 'label') },
  ]

  const canPost = (() => {
    if (submitting) return false
    if (postType === 'photo') return !!imageFile
    if (postType === 'article') return !!(title.trim() || content.trim())
    if (postType === 'feeling') return !!(feeling || content.trim())
    return !!content.trim() || !!imageFile
  })()

  const submit = async () => {
    if (!canPost) return
    setSubmitting(true)
    try {
      if (imageFile) {
        const fd = new FormData()
        fd.append('post_type', postType)
        fd.append('content', content.trim())
        if (title.trim()) fd.append('title', title.trim())
        if (feeling) fd.append('feeling', feeling)
        fd.append('image', imageFile)
        await api.post('/posts/create/', fd)
      } else {
        await api.post('/posts/create/', {
          post_type: postType,
          content: content.trim(),
          title: title.trim(),
          feeling,
        })
      }
      Toast.toast.success('Post shared!')
      closeModal()
      onSuccess()
    } catch {
      Toast.toast.danger('Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

  // Reusable image dropzone / preview
  const imageBlock = (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
      {imagePreview ? (
        <div className="relative overflow-hidden rounded-xl border border-[--surface-secondary]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="Preview" className="max-h-80 w-full object-cover" />
          <button
            onClick={clearImage}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[--surface-secondary] py-10 text-center transition-colors hover:border-[--accent]/50 hover:bg-[--surface-secondary]/40"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <ImagePlus size={26} className="text-blue-500" />
          </span>
          <span>
            <span className="block font-medium text-[--foreground]">Click to upload an image</span>
            <span className="mt-0.5 block text-sm text-[--muted]">PNG, JPG or GIF · up to 10 MB</span>
          </span>
        </button>
      )}
    </>
  )

  const modalEl = open ? (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

      <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
        <Card className="max-h-[90vh] overflow-hidden border border-[--surface-secondary] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[--surface-secondary] px-5 py-4">
            <div className="flex items-center gap-3">
              <Avatar size="md" color="accent">
                {user?.avatar_url
                  ? <Avatar.Image src={user.avatar_url} alt={user.username ?? ''} />
                  : <Avatar.Fallback className="font-bold">{initials}</Avatar.Fallback>
                }
              </Avatar>
              <div>
                <p className="font-semibold text-[--foreground]">{user?.first_name} {user?.last_name}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Globe size={11} className="text-[--muted]" />
                  <span className="text-xs text-[--muted]">Share with everyone</span>
                </div>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground]"
            >
              <X size={16} />
            </button>
          </div>

          <Tabs selectedKey={postType} onSelectionChange={k => setPostType(k as PostType)}>
            <Tabs.List className="border-b border-[--surface-secondary] px-5 pt-0">
              <Tabs.Tab id="text" className="text-sm"><FileText size={13} className="mr-1.5 inline" />Text</Tabs.Tab>
              <Tabs.Tab id="photo" className="text-sm"><ImagePlus size={13} className="mr-1.5 inline text-blue-500" />Photo</Tabs.Tab>
              <Tabs.Tab id="article" className="text-sm"><FileText size={13} className="mr-1.5 inline text-green-500" />Article</Tabs.Tab>
              <Tabs.Tab id="feeling" className="text-sm"><Smile size={13} className="mr-1.5 inline text-yellow-500" />Feeling</Tabs.Tab>
            </Tabs.List>

            <div className="max-h-[60vh] overflow-y-auto">
              {/* ── Text ── */}
              <Tabs.Panel id="text">
                <div className="px-5 py-4">
                  <TextArea
                    placeholder={`What's on your mind, ${user?.first_name || user?.username}?`}
                    value={content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                    rows={6}
                    fullWidth
                    autoFocus
                    className="resize-none text-base"
                  />
                </div>
              </Tabs.Panel>

              {/* ── Photo ── */}
              <Tabs.Panel id="photo">
                <div className="flex flex-col gap-4 px-5 py-4">
                  {imageBlock}
                  <TextArea
                    placeholder="Add a caption…"
                    value={content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                    rows={2}
                    fullWidth
                    className="resize-none"
                  />
                </div>
              </Tabs.Panel>

              {/* ── Article ── */}
              <Tabs.Panel id="article">
                <div className="flex flex-col gap-3 px-5 py-4">
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Article title"
                    className="w-full bg-transparent text-xl font-bold text-[--foreground] outline-none placeholder:text-[--muted]"
                  />

                  {/* Toolbar + write/preview switch */}
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-[--surface-secondary] px-1.5 py-1">
                    <div className="flex items-center gap-0.5">
                      {/* eslint-disable-next-line react-hooks/refs -- run() reads the ref only on click, not during render */}
                      {TOOLBAR.map(({ icon: Icon, label, run }) => (
                        <button
                          key={label}
                          type="button"
                          title={label}
                          aria-label={label}
                          onClick={run}
                          disabled={articleView === 'preview'}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground] disabled:opacity-40"
                        >
                          <Icon size={15} />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setArticleView(v => (v === 'write' ? 'preview' : 'write'))}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[--accent] transition-colors hover:bg-[--accent]/10"
                    >
                      {articleView === 'write' ? <><Eye size={13} /> Preview</> : <><Pencil size={13} /> Write</>}
                    </button>
                  </div>

                  {articleView === 'write' ? (
                    <TextArea
                      ref={bodyRef}
                      placeholder="Write your article in markdown… **bold**, _italic_, ## heading, - lists, > quotes"
                      value={content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                      rows={10}
                      fullWidth
                      className="resize-none font-mono text-sm"
                    />
                  ) : (
                    <div className="min-h-56 rounded-lg border border-[--surface-secondary] p-4">
                      {title && <h1 className="mb-2 text-xl font-bold text-[--foreground]">{title}</h1>}
                      {content.trim()
                        ? <Markdown>{content}</Markdown>
                        : <p className="text-sm italic text-[--muted]">Nothing to preview yet.</p>}
                    </div>
                  )}

                  {/* optional cover image */}
                  {imageBlock}
                </div>
              </Tabs.Panel>

              {/* ── Feeling ── */}
              <Tabs.Panel id="feeling">
                <div className="flex flex-col gap-4 px-5 py-4">
                  <TextArea
                    placeholder={`What's on your mind, ${user?.first_name || user?.username}?`}
                    value={content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                    rows={3}
                    fullWidth
                    autoFocus
                  />
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[--muted]">Choose a feeling</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {FEELINGS.map(f => {
                        const value = `${f.emoji} ${f.label}`
                        const selected = feeling === value
                        return (
                          <button
                            key={f.label}
                            type="button"
                            onClick={() => setFeeling(selected ? '' : value)}
                            className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-all ${
                              selected
                                ? 'border-[--accent] bg-[--accent]/10 text-[--accent] shadow-sm'
                                : 'border-[--surface-secondary] text-[--muted] hover:border-[--muted]/40 hover:bg-[--surface-secondary]'
                            }`}
                          >
                            <span className="text-xl">{f.emoji}</span>
                            <span className="text-[10px] font-medium">{f.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {feeling && (
                    <div className="flex items-center gap-2 rounded-lg bg-[--surface-secondary] px-3 py-2">
                      <span className="text-sm text-[--muted]">Feeling</span>
                      <Chip size="sm" color="accent" variant="soft">{feeling}</Chip>
                      <button onClick={() => setFeeling('')} className="ml-auto text-[--muted] hover:text-[--foreground]">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </Tabs.Panel>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[--surface-secondary] px-5 py-3">
            <span className="text-xs text-[--muted]">
              {content.length > 0 ? `${content.length} character${content.length !== 1 ? 's' : ''}` : 'Be the first to share today'}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onPress={closeModal} isDisabled={submitting}>Cancel</Button>
              <Button
                size="sm"
                onPress={submit}
                isDisabled={!canPost}
                className="min-w-16 bg-[--accent] text-[--accent-foreground]"
              >
                {submitting ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  ) : null

  return (
    <>
      {/* Inline trigger card */}
      <Card className="border border-[--surface-secondary] shadow-sm">
        <Card.Content className="p-3">
          <div className="flex items-center gap-3">
            <Avatar size="sm" color="accent">
              {user?.avatar_url
                ? <Avatar.Image src={user.avatar_url} alt={user.username ?? ''} />
                : <Avatar.Fallback>{initials}</Avatar.Fallback>
              }
            </Avatar>
            <button
              onClick={() => openModal('text')}
              className="flex-1 rounded-full border border-[--surface-secondary] bg-[--background] px-4 py-2 text-left text-sm text-[--muted] transition-colors hover:border-[--muted] hover:bg-[--surface-secondary]"
            >
              What&apos;s on your mind, {user?.first_name || user?.username}?
            </button>
          </div>

          <div className="mt-3 flex items-center gap-1 border-t border-[--surface-secondary] pt-2">
            <button onClick={() => openModal('photo')} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium text-[--muted] transition-colors hover:bg-[--surface-secondary]">
              <ImagePlus size={15} className="text-blue-500" /> Photo
            </button>
            <button onClick={() => openModal('article')} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium text-[--muted] transition-colors hover:bg-[--surface-secondary]">
              <FileText size={15} className="text-green-500" /> Article
            </button>
            <button onClick={() => openModal('feeling')} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium text-[--muted] transition-colors hover:bg-[--surface-secondary]">
              <Smile size={15} className="text-yellow-500" /> Feeling
            </button>
          </div>
        </Card.Content>
      </Card>

      {mounted && createPortal(modalEl, document.body)}
    </>
  )
}

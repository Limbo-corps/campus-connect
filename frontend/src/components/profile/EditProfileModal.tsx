'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Card, Button, Input, TextArea, Tabs, Avatar, Chip, Toast } from '@heroui/react'
import { X, Shuffle, Check, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AVATAR_STYLES, SEED_POOL, dicebearUrl, isDicebear } from '@/lib/avatars'
import { PROFILE_TEMPLATES } from '@/lib/templates'
import { IMG_FADE } from '@/lib/banners'
import type { User } from '@/types'

interface Props {
  open: boolean
  onClose(): void
}

export default function EditProfileModal({ open, onClose }: Props) {
  const { user, updateProfile } = useAuth()
  if (!open || typeof document === 'undefined') return null

  return (
    <EditProfileModalBody
      key={`${open ? 'open' : 'closed'}-${user?.id ?? 'guest'}`}
      user={user}
      updateProfile={updateProfile}
      onClose={onClose}
    />
  )
}

function EditProfileModalBody({
  user,
  updateProfile,
  onClose,
}: {
  user: User | null
  updateProfile(data: {
    first_name?: string
    last_name?: string
    tagline?: string
    bio?: string
    avatar_url?: string
    profile_template?: string
  }): Promise<void>
  onClose(): void
}) {
  const [saving, setSaving] = useState(false)

  const [firstName, setFirstName] = useState(() => user?.first_name ?? '')
  const [lastName, setLastName] = useState(() => user?.last_name ?? '')
  const [tagline, setTagline] = useState(() => user?.tagline ?? '')
  const [bio, setBio] = useState(() => user?.bio ?? '')
  const [avatarStyle, setAvatarStyle] = useState(() => {
    if (!user || !isDicebear(user.avatar_url)) return 'adventurer'
    try {
      const u = new URL(user.avatar_url as string)
      return u.pathname.split('/')[2] ?? 'adventurer'
    } catch {
      return 'adventurer'
    }
  })
  const [avatarSeed, setAvatarSeed] = useState(() => {
    if (!user) return 'campus'
    if (isDicebear(user.avatar_url)) {
      try {
        const u = new URL(user.avatar_url as string)
        return u.searchParams.get('seed') ?? user.username
      } catch {
        return user.username
      }
    }
    return user.username || 'campus'
  })
  const [template, setTemplate] = useState(() => user?.profile_template || 'aurora')

  const previewUrl = dicebearUrl(avatarStyle, avatarSeed)

  const shuffle = () => {
    const next = SEED_POOL[Math.floor(Math.random() * SEED_POOL.length)] + Math.floor(Math.random() * 999)
    setAvatarSeed(next)
  }

  const save = async () => {
    setSaving(true)
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        tagline,
        bio,
        avatar_url: previewUrl,
        profile_template: template,
      })
      Toast.toast.success('Profile updated — looking fresh! ✨')
      onClose()
    } catch {
      Toast.toast.danger('Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const el = (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl">
        <Card className="max-h-[88vh] overflow-hidden border border-[--surface-secondary] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[--surface-secondary] px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[--accent]" />
              <h2 className="text-base font-bold text-[--foreground]">Customize your profile</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground]"
            >
              <X size={16} />
            </button>
          </div>

          {/* Live preview header */}
          <div className="flex items-center gap-3 border-b border-[--surface-secondary] bg-[--surface] px-5 py-3">
            <Avatar className="size-14 ring-2 ring-[--accent]/40">
              <Avatar.Image src={previewUrl} alt="preview" />
              <Avatar.Fallback>{(firstName[0] ?? user?.username[0] ?? '?').toUpperCase()}</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[--foreground]">
                {firstName || user?.username} {lastName}
              </p>
              <p className="truncate text-xs text-[--muted]">{tagline || 'Add a tagline below…'}</p>
            </div>
          </div>

          <div className="max-h-[52vh] overflow-y-auto">
            <Tabs>
              <Tabs.List className="px-5 pt-2">
                <Tabs.Tab id="avatar">Avatar</Tabs.Tab>
                <Tabs.Tab id="details">Details</Tabs.Tab>
                <Tabs.Tab id="template">Template</Tabs.Tab>
              </Tabs.List>

              {/* Avatar picker */}
              <Tabs.Panel id="avatar">
                <div className="space-y-4 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wider text-[--muted]">Pick a vibe</p>
                    <Button size="sm" variant="ghost" onPress={shuffle} className="gap-1.5 text-xs">
                      <Shuffle size={13} /> Shuffle
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {AVATAR_STYLES.map(style => {
                      const active = style.id === avatarStyle
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setAvatarStyle(style.id)}
                          className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${
                            active
                              ? 'border-[--accent] bg-[--accent]/10 shadow-sm'
                              : 'border-[--surface-secondary] hover:border-[--muted]/40 hover:bg-[--surface-secondary]'
                          }`}
                        >
                          <Avatar className="size-12">
                            <Avatar.Image src={dicebearUrl(style.id, avatarSeed)} alt={style.label} />
                            <Avatar.Fallback>{style.label[0]}</Avatar.Fallback>
                          </Avatar>
                          <span className={`text-[10px] font-medium ${active ? 'text-[--accent]' : 'text-[--muted]'}`}>
                            {style.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[--muted]">Quick seeds</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SEED_POOL.slice(0, 8).map(s => (
                        <Chip
                          key={s}
                          size="sm"
                          variant="soft"
                          color={avatarSeed === s ? 'accent' : 'default'}
                          className={`cursor-pointer text-[11px] ${avatarSeed === s ? 'ring-1 ring-[--accent]' : ''}`}
                          onClick={() => setAvatarSeed(s)}
                        >
                          {s}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </Tabs.Panel>

              {/* Details */}
              <Tabs.Panel id="details">
                <div className="space-y-3 px-5 py-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="First name" value={firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)} fullWidth />
                    <Input placeholder="Last name" value={lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)} fullWidth />
                  </div>
                  <Input
                    placeholder="Tagline — e.g. 'CS @ IIT • coffee-powered 🚀'"
                    value={tagline}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagline(e.target.value)}
                    fullWidth
                    maxLength={120}
                  />
                  <TextArea
                    placeholder="Bio — tell the campus your story…"
                    value={bio}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                    rows={4}
                    fullWidth
                  />
                </div>
              </Tabs.Panel>

              {/* Template */}
              <Tabs.Panel id="template">
                <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-3">
                  {PROFILE_TEMPLATES.map(t => {
                    const active = t.key === template
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTemplate(t.key)}
                        className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                          active ? 'border-[--accent] shadow-md ring-2 ring-[--accent]/30' : 'border-[--surface-secondary] hover:border-[--muted]/40'
                        }`}
                      >
                        <div
                          className="h-16 bg-cover bg-center"
                          style={{ backgroundImage: `${IMG_FADE}, url('${t.banner}')` }}
                        />
                        {active && (
                          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[--accent] text-white">
                            <Check size={12} />
                          </span>
                        )}
                        <div className="px-2.5 py-2">
                          <p className="text-xs font-semibold text-[--foreground]">{t.emoji} {t.label}</p>
                          <p className="text-[10px] text-[--muted]">{t.vibe}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Tabs.Panel>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[--surface-secondary] px-5 py-3">
            <Button variant="ghost" size="sm" onPress={onClose} isDisabled={saving}>Cancel</Button>
            <Button size="sm" onPress={save} isDisabled={saving} className="min-w-20 bg-[--accent] text-[--accent-foreground]">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )

  return createPortal(el, document.body)
}

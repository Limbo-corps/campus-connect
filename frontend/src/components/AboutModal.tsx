'use client'

import { createPortal } from 'react-dom'
import { Card, Button, Chip } from '@heroui/react'
import { X, Rss, Building2, Heart, MessageCircle, Palette, Sparkles } from 'lucide-react'
import { LogoMark } from '@/components/Logo'

interface Props {
  open: boolean
  onClose(): void
  onOpenHelp?(): void
}

const FEATURES = [
  { icon: Rss, title: 'A feed that feels like home', desc: 'Share posts, react, and keep up with what your campus is talking about.' },
  { icon: Building2, title: '79 campuses & counting', desc: 'Join your IIT, NIT, or IIIT and connect with students who get it.' },
  { icon: Heart, title: 'Show the love', desc: 'Like and comment to spark real conversations — no algorithms, just people.' },
  { icon: Palette, title: 'Make it yours', desc: 'Pick any accent colour, a cute avatar, and a profile template that matches your vibe.' },
]

export default function AboutModal({ open, onClose, onOpenHelp }: Props) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg">
        <Card className="overflow-hidden border border-[--surface-secondary] shadow-2xl">
          <div className="flex items-start justify-between px-6 pt-6">
            <div className="flex items-center gap-3">
              <LogoMark size={48} />
              <div>
                <h2 className="text-lg font-extrabold text-[--foreground]">Campus Connect</h2>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Chip size="sm" color="accent" variant="soft" className="text-[10px]">
                    <Sparkles size={9} className="mr-0.5 inline" /> v1.0
                  </Chip>
                  <span className="text-[11px] text-[--muted]">where campus life connects</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-4">
            <p className="text-sm leading-relaxed text-[--muted]">
              Campus Connect is a social network built <span className="font-semibold text-[--foreground]">for students, by students</span> —
              a single place to share moments, find your people, and stay plugged into life across India&apos;s top campuses.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-[--surface-secondary] bg-[--surface] p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--accent]/12 text-[--accent]">
                    <Icon size={16} />
                  </span>
                  <p className="mt-2 text-xs font-bold text-[--foreground]">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[--muted]">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[--surface-secondary] px-6 py-3">
            <span className="text-[11px] text-[--muted]">Made with 💜 for campus communities</span>
            <div className="flex gap-2">
              {onOpenHelp && (
                <Button variant="ghost" size="sm" onPress={() => { onClose(); onOpenHelp() }} className="gap-1.5">
                  <MessageCircle size={13} /> Need help?
                </Button>
              )}
              <Button size="sm" onPress={onClose} className="bg-[--accent] text-[--accent-foreground]">
                Let&apos;s go
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>,
    document.body
  )
}

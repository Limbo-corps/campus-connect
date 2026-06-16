'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Card, Button, Input, TextArea, Toast, Accordion } from '@heroui/react'
import { X, LifeBuoy, Send, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  open: boolean
  onClose(): void
}

const FAQS = [
  { q: 'How do I join a campus?', a: 'Head to the Campus tab, find your institute, and hit Join. You can be a member of one campus at a time.' },
  { q: 'Can I change my avatar or theme?', a: 'Yes! Open Edit Profile for cute avatars and profile templates, and use the palette icon in the navbar to recolour the whole app.' },
  { q: 'How do I edit or delete a post?', a: 'On your own post, tap the ⋯ menu and choose Edit or Delete.' },
  { q: 'I found a bug / have a feature idea', a: 'Use the form here — it goes straight to the maintainer. Include as much detail as you can.' },
]

export default function HelpModal({ open, onClose }: Props) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // prefill from the signed-in user when opened
  useEffect(() => {
    if (open && user) {
      setName(`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username)
      setEmail(user.email ?? '')
    }
  }, [open, user])

  const submit = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await api.post('/contact/', { name, email, message })
      setSent(true)
      setMessage('')
      Toast.toast.success('Message sent — we’ll get back to you!')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      Toast.toast.danger(
        status === 503 ? 'Contact isn’t configured on this server yet.' : 'Could not send — try again later.'
      )
    } finally {
      setSending(false)
    }
  }

  const close = () => { setSent(false); onClose() }

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="relative z-10 w-full max-w-lg">
        <Card className="max-h-[88vh] overflow-hidden border border-[--surface-secondary] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[--surface-secondary] px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-[--foreground]">
              <LifeBuoy size={18} className="text-[--accent]" /> Help &amp; support
            </h2>
            <button
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
            {/* FAQs */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[--muted]">Quick answers</p>
            <Accordion variant="default" className="mb-5">
              {FAQS.map((f, i) => (
                <Accordion.Item key={i} id={`faq-${i}`}>
                  <Accordion.Heading>
                    <Accordion.Trigger className="py-2 text-sm font-medium text-[--foreground]">
                      {f.q}
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body className="pb-3 pt-0 text-sm text-[--muted]">{f.a}</Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>

            {/* Contact form */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[--muted]">Still stuck? Message us</p>

            {sent ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-[--surface-secondary] bg-[--surface] py-8 text-center">
                <CheckCircle2 size={32} className="text-emerald-500" />
                <p className="text-sm font-semibold text-[--foreground]">Message sent!</p>
                <p className="max-w-xs text-xs text-[--muted]">Thanks for reaching out — we read every message and will follow up if you left an email.</p>
                <Button size="sm" variant="ghost" onPress={() => setSent(false)} className="mt-1">Send another</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Your name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} fullWidth />
                  <Input type="email" placeholder="Email (so we can reply)" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} fullWidth />
                </div>
                <TextArea
                  placeholder="What's going on? The more detail, the better."
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                  rows={4}
                  fullWidth
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[--muted]">Your message goes straight to the team.</span>
                  <Button
                    size="sm"
                    onPress={submit}
                    isDisabled={sending || !message.trim()}
                    className="gap-1.5 bg-[--accent] text-[--accent-foreground]"
                  >
                    <Send size={13} /> {sending ? 'Sending…' : 'Send'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>,
    document.body
  )
}

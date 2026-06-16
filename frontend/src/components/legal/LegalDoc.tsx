'use client'

import Link from 'next/link'
import { Card, Breadcrumbs, Chip } from '@heroui/react'
import { ArrowLeft, CalendarClock } from 'lucide-react'
import { LEGAL_DOCS, LEGAL_LINKS, type LegalDoc as Doc } from '@/lib/legal'
import { useDialogs } from '@/contexts/DialogsContext'

/**
 * Unique two-pane document layout (not a plain scrolling article): a sticky
 * left rail with the doc switcher + an in-page table of contents, and a right
 * column of numbered section panels. Reused by /privacy, /terms, /accessibility.
 */
export default function LegalDoc({ slug }: { slug: Doc['slug'] }) {
  const doc = LEGAL_DOCS[slug]
  const Icon = doc.icon
  const { openHelp } = useDialogs()

  return (
    <div className="space-y-5">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/feed">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item>{doc.title}</Breadcrumbs.Item>
      </Breadcrumbs>

      {/* Hero header */}
      <Card className="relative overflow-hidden border border-[--surface-secondary] shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[--accent]/15 via-transparent to-[--accent]/5" />
        <Card.Content className="relative flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[--accent]/15 text-[--accent]">
              <Icon size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[--foreground]">{doc.title}</h1>
              <p className="mt-0.5 text-sm text-[--muted]">{doc.tagline}</p>
            </div>
          </div>
          <Chip size="sm" variant="soft" color="accent" className="self-start text-[11px] sm:self-center">
            <CalendarClock size={11} className="mr-1 inline" />
            Updated {doc.updated}
          </Chip>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* ── Left rail: doc switcher + TOC ── */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="sticky top-20 space-y-3">
            <Card className="border border-[--surface-secondary] shadow-sm">
              <Card.Content className="p-2">
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[--muted]">
                  Policies
                </p>
                <nav className="space-y-0.5">
                  {LEGAL_LINKS.map(l => {
                    const active = l.href === `/${slug}`
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'bg-[--accent]/12 text-[--accent]'
                            : 'text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]'
                        }`}
                      >
                        {l.label}
                      </Link>
                    )
                  })}
                </nav>
              </Card.Content>
            </Card>

            <Card className="border border-[--surface-secondary] shadow-sm">
              <Card.Content className="p-2">
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[--muted]">
                  On this page
                </p>
                <nav className="space-y-0.5">
                  {doc.sections.map((s, i) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground]"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[--surface-secondary] text-[10px] font-bold text-[--accent]">
                        {i + 1}
                      </span>
                      {s.heading}
                    </a>
                  ))}
                </nav>
              </Card.Content>
            </Card>

            <Link
              href="/feed"
              className="flex items-center gap-1.5 px-2 text-xs font-medium text-[--muted] transition-colors hover:text-[--accent]"
            >
              <ArrowLeft size={13} /> Back to feed
            </Link>
          </div>
        </aside>

        {/* ── Right: numbered section panels ── */}
        <div className="col-span-12 space-y-3 lg:col-span-8">
          {doc.sections.map((s, i) => (
            <Card
              key={s.id}
              id={s.id}
              className="scroll-mt-20 border border-[--surface-secondary] shadow-sm"
            >
              <Card.Content className="py-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[--accent]/12 text-xs font-bold text-[--accent]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-[--foreground]">{s.heading}</h2>
                    <div className="mt-2 space-y-2">
                      {s.body.map((p, j) => (
                        <p key={j} className="text-sm leading-relaxed text-[--muted]">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}

          <Card className="border border-dashed border-[--surface-secondary]">
            <Card.Content className="flex flex-col items-center gap-1 py-6 text-center">
              <p className="text-sm font-medium text-[--foreground]">Still have questions?</p>
              <button
                onClick={openHelp}
                className="text-sm font-semibold text-[--accent] hover:underline"
              >
                Contact Help &amp; support
              </button>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  )
}

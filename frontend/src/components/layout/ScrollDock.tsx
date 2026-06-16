'use client'

import { useEffect, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

/**
 * Floating vertical scroll dock — a frosted capsule pinned to the right edge.
 * Top button jumps to the top, the centre is a live circular scroll-progress
 * ring (shows how far down the page you are), the bottom button jumps to the
 * end. Hidden until the page is actually scrollable + scrolled a little, so it
 * never clutters short pages. A deliberately non-social, "instrument panel"
 * control rather than the usual lone back-to-top arrow.
 */
export default function ScrollDock() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const y = window.scrollY
      setProgress(max > 0 ? Math.min(1, y / max) : 0)
      setVisible(max > 240 && y > 160)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const toBottom = () =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })

  // ring geometry
  const R = 13
  const C = 2 * Math.PI * R
  const pct = Math.round(progress * 100)

  return (
    <div
      aria-hidden={!visible}
      className={`fixed right-3 top-1/2 z-40 -translate-y-1/2 transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-1 rounded-full border border-[--surface-secondary] bg-[--surface]/80 p-1.5 shadow-lg backdrop-blur-xl">
        <button
          type="button"
          onClick={toTop}
          aria-label="Scroll to top"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[--muted] transition-colors hover:bg-[--accent]/15 hover:text-[--accent]"
        >
          <ChevronUp size={16} />
        </button>

        {/* progress ring with % in the middle */}
        <div className="relative flex h-8 w-8 items-center justify-center" title={`${pct}% read`}>
          <svg viewBox="0 0 32 32" className="h-8 w-8 -rotate-90">
            <circle cx="16" cy="16" r={R} fill="none" stroke="var(--surface-secondary)" strokeWidth="3" />
            <circle
              cx="16"
              cy="16"
              r={R}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-150"
            />
          </svg>
          <span className="absolute text-[8px] font-bold tabular-nums text-[--foreground]">{pct}</span>
        </div>

        <button
          type="button"
          onClick={toBottom}
          aria-label="Scroll to bottom"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[--muted] transition-colors hover:bg-[--accent]/15 hover:text-[--accent]"
        >
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  )
}

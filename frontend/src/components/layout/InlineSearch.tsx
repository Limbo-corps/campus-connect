'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
  /** width of the field once expanded (Tailwind class). Defaults to a tidy max. */
  expandedWidth?: string
}

/**
 * Compact, space-efficient search: collapses to a single icon button and
 * expands inline on click (or whenever it holds a query). Replaces the heavy
 * full-bleed SearchField blocks so list headers stay clean. Styled purely with
 * HeroUI theme tokens to sit alongside HeroUI components.
 */
export default function InlineSearch({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  expandedWidth = 'w-56',
}: Props) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const expanded = open || value.length > 0

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  return (
    <div
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-[--surface] transition-all duration-300 ${
        expanded
          ? `${expandedWidth} max-w-full border-[--accent]/40 px-3 shadow-sm`
          : 'w-9 justify-center border-[--surface-secondary]'
      }`}
    >
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(true)}
        className="shrink-0 text-[--muted] transition-colors hover:text-[--accent]"
      >
        <Search size={16} />
      </button>
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => { if (!value) setOpen(false) }}
        placeholder={placeholder}
        aria-label={label}
        className={`min-w-0 flex-1 bg-transparent text-sm text-[--foreground] outline-none placeholder:text-[--muted] ${
          expanded ? 'block' : 'hidden'
        }`}
      />
      {expanded && value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => { onChange(''); inputRef.current?.focus() }}
          className="shrink-0 text-[--muted] transition-colors hover:text-[--foreground]"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

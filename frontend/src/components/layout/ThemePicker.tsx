'use client'

import { useState, useRef, useEffect } from 'react'
import { Palette, RotateCcw, Check } from 'lucide-react'
import { useAccent } from '@/contexts/ThemeAccentContext'
import { ACCENT_PRESETS, DEFAULT_HUE, swatch, nearestPreset } from '@/lib/themes'

interface Props {
  /** position of the popover panel relative to the trigger. Use 'top' when the
   *  picker sits at the bottom of a container (e.g. the sidebar) so the panel
   *  opens upward and stays on-screen. */
  panelClassName?: string
  /** override the trigger button hover styles (e.g. on an accent surface) */
  triggerClassName?: string
}

export default function ThemePicker({ panelClassName, triggerClassName }: Props = {}) {
  const { hue, setHue, reset } = useAccent()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active = nearestPreset(hue)
  const isDefault = Math.abs(hue - DEFAULT_HUE) < 0.5

  // close on outside-click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Theme colour"
        title="Theme colour"
        onClick={() => setOpen(o => !o)}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${triggerClassName ?? 'hover:bg-[--surface-secondary]'}`}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm ring-1 ring-black/10"
          style={{ background: swatch(hue) }}
        >
          <Palette size={11} />
        </span>
      </button>

      {open && (
        <div
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-secondary)' }}
          className={`absolute z-9999 w-72 rounded-2xl border p-3 shadow-2xl ${panelClassName ?? 'right-0 top-11'}`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-[--foreground]">Accent colour</span>
            <span className="text-[11px] text-[--muted]">{active.name}</span>
          </div>

          {/* Swatch grid */}
          <div className="grid grid-cols-8 gap-1.5">
            {ACCENT_PRESETS.map(p => {
              const selected = Math.abs(p.hue - hue) < 0.5
              return (
                <button
                  key={p.name}
                  type="button"
                  title={p.name}
                  onClick={() => setHue(p.hue)}
                  className={`flex aspect-square items-center justify-center rounded-full ring-1 ring-black/10 transition-transform hover:scale-110 ${
                    selected ? 'ring-2 ring-[--foreground]' : ''
                  }`}
                  style={{ background: swatch(p.hue) }}
                >
                  {selected && <Check size={12} className="text-white drop-shadow" />}
                </button>
              )
            })}
          </div>

          {/* Custom hue slider — anything on the wheel */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[--muted]">Custom hue</span>
              <span className="text-[11px] tabular-nums text-[--muted]">{Math.round(hue)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={hue}
              onChange={e => setHue(parseFloat(e.target.value))}
              aria-label="Custom hue"
              className="h-3 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
              style={{
                background:
                  'linear-gradient(to right, oklch(62% 0.195 0), oklch(62% 0.195 60), oklch(62% 0.195 120), oklch(62% 0.195 180), oklch(62% 0.195 240), oklch(62% 0.195 300), oklch(62% 0.195 360))',
              }}
            />
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={reset}
            disabled={isDefault}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[--surface-secondary] py-1.5 text-xs font-medium text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={12} /> Reset to default
          </button>
        </div>
      )}
    </div>
  )
}

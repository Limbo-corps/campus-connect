'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { DEFAULT_HUE, STORAGE_KEY } from '@/lib/themes'

interface ThemeAccentContextType {
  hue: number
  setHue(hue: number): void
  reset(): void
}

const ThemeAccentContext = createContext<ThemeAccentContextType | null>(null)

function applyHue(hue: number) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--app-hue', String(hue))
  }
}

export function ThemeAccentProvider({ children }: { children: ReactNode }) {
  const [hue, setHueState] = useState<number>(DEFAULT_HUE)

  // hydrate from localStorage (the inline <head> script already applied it pre-paint)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setHueState(parseFloat(saved))
    } catch { /* ignore */ }
  }, [])

  const setHue = useCallback((next: number) => {
    setHueState(next)
    applyHue(next)
    try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { /* ignore */ }
  }, [])

  const reset = useCallback(() => {
    setHueState(DEFAULT_HUE)
    applyHue(DEFAULT_HUE)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  return (
    <ThemeAccentContext.Provider value={{ hue, setHue, reset }}>
      {children}
    </ThemeAccentContext.Provider>
  )
}

export function useAccent() {
  const ctx = useContext(ThemeAccentContext)
  if (!ctx) throw new Error('useAccent must be used within ThemeAccentProvider')
  return ctx
}

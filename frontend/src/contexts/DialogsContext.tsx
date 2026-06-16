'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import AboutModal from '@/components/AboutModal'
import HelpModal from '@/components/HelpModal'

interface DialogsContextType {
  openAbout(): void
  openHelp(): void
}

const DialogsContext = createContext<DialogsContextType | null>(null)

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <DialogsContext.Provider value={{ openAbout: () => setAboutOpen(true), openHelp: () => setHelpOpen(true) }}>
      {children}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} onOpenHelp={() => setHelpOpen(true)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </DialogsContext.Provider>
  )
}

export function useDialogs() {
  const ctx = useContext(DialogsContext)
  if (!ctx) throw new Error('useDialogs must be used within DialogsProvider')
  return ctx
}

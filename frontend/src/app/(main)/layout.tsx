'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner, Toast } from '@heroui/react'
import { Menu } from 'lucide-react'
import AppSidebar from '@/components/layout/AppSidebar'
import CollapsedRail from '@/components/layout/CollapsedRail'
import ScrollDock from '@/components/layout/ScrollDock'
import { LogoMark } from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { DialogsProvider } from '@/contexts/DialogsContext'

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [navOpen, setNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  // restore collapsed preference from localStorage on mount (external-sync)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem('sidebar-collapsed') === '1') setCollapsed(true)
  }, [])

  const setCollapsedPersist = (val: boolean) => {
    setCollapsed(val)
    localStorage.setItem('sidebar-collapsed', val ? '1' : '0')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[--background]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return null

  return (
    <DialogsProvider>
      <div className="relative min-h-screen bg-[--page-bg]">
        {/* campus-themed doodle + glow backdrop (fills empty space) */}
        <div aria-hidden className="app-backdrop" />

        {/* Persistent left sidebar (Slack-style); drawer on mobile. Collapses to a slim rail on desktop. */}
        <AppSidebar
          open={navOpen}
          onClose={() => setNavOpen(false)}
          collapsed={collapsed}
          onCollapse={() => setCollapsedPersist(true)}
        />
        {collapsed && <CollapsedRail onExpand={() => setCollapsedPersist(false)} />}
        {navOpen && (
          <div
            aria-hidden
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setNavOpen(false)}
          />
        )}

        <div className={`relative z-10 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
          {/* Mobile top bar — only place the menu button lives */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[--surface-secondary] bg-[--surface]/95 px-4 backdrop-blur-xl lg:hidden">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[--muted] transition-colors hover:bg-[--surface-secondary] hover:text-[--foreground]"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <LogoMark size={26} />
              <span className="text-sm font-bold tracking-tight text-[--foreground]">Campus Connect</span>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8">{children}</main>
        </div>

        <ScrollDock />
        <Toast.Provider placement="top" />
      </div>
    </DialogsProvider>
  )
}

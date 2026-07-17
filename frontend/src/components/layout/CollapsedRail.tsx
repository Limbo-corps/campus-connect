'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Avatar } from '@heroui/react'
import { Rss, Building2, User, LogOut, Sun, Moon, PanelLeftOpen, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import NotificationsBell from '@/components/layout/NotificationsBell'
import ThemePicker from '@/components/layout/ThemePicker'

/**
 * Slim icon rail shown on desktop when the full sidebar is collapsed. Uses the
 * same solid accent fill (--sidebar) as the full sidebar so the two read as one
 * surface. Holds the same options — profile, nav, controls — as compact icons
 * with native tooltips. Desktop-only (`lg:flex`).
 */
export default function CollapsedRail({ onExpand }: { onExpand: () => void }) {
  const { user, logout } = useAuth()
  const { totalUnread } = useChat()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.username[0].toUpperCase()
    : '?'

  const NAV = [
    { href: '/feed', icon: Rss, label: 'Feed', badge: 0 },
    { href: '/chat', icon: MessageSquare, label: 'Messages', badge: totalUnread },
    { href: '/campus', icon: Building2, label: 'Campuses', badge: 0 },
    { href: '/profile', icon: User, label: 'Profile', badge: 0 },
  ]

  return (
    <aside
      style={{ backgroundColor: 'var(--sidebar)' }}
      className="fixed inset-y-0 left-0 z-50 hidden w-16 flex-col items-center gap-1 border-r border-white/10 py-3 text-white lg:flex"
    >
      {/* Expand */}
      <button
        onClick={onExpand}
        title="Expand sidebar"
        aria-label="Expand sidebar"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/10 hover:text-white"
      >
        <PanelLeftOpen size={18} />
      </button>

      {/* Profile avatar */}
      <Link href="/profile" title={user?.first_name || 'Your profile'} className="my-1 rounded-full transition-transform hover:scale-105">
        <Avatar size="sm" color="accent">
          {user?.avatar_url
            ? <Avatar.Image src={user.avatar_url} alt={user.username ?? ''} />
            : <Avatar.Fallback className="text-[11px] font-bold">{initials}</Avatar.Fallback>}
        </Avatar>
      </Link>

      <div className="my-1 h-px w-8 bg-white/15" />

      {/* Nav icons */}
      {NAV.map(({ href, icon: Icon, label, badge }) => {
        const active = href === '/feed' ? pathname === '/feed' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            title={badge > 0 ? `${label} (${badge})` : label}
            aria-label={label}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
              active ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {active && <span className="absolute left-0 h-5 w-1 rounded-r-full bg-white" />}
            <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
            {badge > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-[--accent] shadow">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </Link>
        )
      })}

      <div className="flex-1" />

      {/* Controls */}
      <NotificationsBell placement="top start" triggerClassName="text-white/85 hover:bg-white/15 hover:text-white" />
      <ThemePicker panelClassName="bottom-12 left-0" triggerClassName="hover:bg-white/15" />
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        title="Toggle theme"
        aria-label="Toggle theme"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/10 hover:text-white"
      >
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <button
        onClick={logout}
        title="Sign out"
        aria-label="Sign out"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <LogOut size={17} />
      </button>
    </aside>
  )
}

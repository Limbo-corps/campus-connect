'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Avatar } from '@heroui/react'
import { Rss, Building2, User, LogOut, Sun, Moon, MapPin, X, PanelLeftClose } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDialogs } from '@/contexts/DialogsContext'
import { usePosts } from '@/hooks/usePosts'
import { useCampuses } from '@/hooks/useCampuses'
import { LogoMark } from '@/components/Logo'
import NotificationsBell from '@/components/layout/NotificationsBell'
import ThemePicker from '@/components/layout/ThemePicker'
import CampusEmblem from '@/components/campus/CampusEmblem'
import { LEGAL_LINKS } from '@/lib/legal'

interface Props {
  open: boolean
  onClose: () => void
  /** when true, the full sidebar is hidden on desktop (the CollapsedRail shows instead) */
  collapsed: boolean
  onCollapse: () => void
}

/**
 * Slack-style application sidebar — a full-height left rail filled with a SOLID
 * theme-accent colour (follows the chosen accent). Everything on it is styled
 * white-on-accent: brand, profile block, MENU nav (active + count badges),
 * CAMPUSES "channel" list, and a pinned bottom bar (notifications, theme
 * controls, sign-out). Fixed on lg+, slides in as a drawer on small screens.
 */
export default function AppSidebar({ open, onClose, collapsed, onCollapse }: Props) {
  const { user, logout } = useAuth()
  const { posts } = usePosts()
  const { campuses } = useCampuses()
  const { openAbout, openHelp } = useDialogs()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.username[0].toUpperCase()
    : '?'

  const userCampusId = (user as unknown as { campus?: string })?.campus
  const userCampus = campuses.find(c => c.id === userCampusId)

  const NAV = [
    { href: '/feed', icon: Rss, label: 'Feed', badge: posts.length },
    { href: '/campus', icon: Building2, label: 'Campuses', badge: campuses.length },
    { href: '/profile', icon: User, label: 'Profile', badge: null as number | null },
  ]

  return (
    <aside
      style={{ backgroundColor: 'var(--sidebar)', color: 'var(--sidebar-foreground)' }}
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'lg:hidden' : 'lg:translate-x-0'}`}
    >
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/15 px-4">
        <button onClick={openAbout} className="flex items-center gap-2 transition-opacity hover:opacity-80" title="About Campus Connect">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
            <LogoMark size={20} />
          </span>
          <span className="text-sm font-bold tracking-tight">Campus Connect</span>
        </button>
        <div className="flex items-center">
          {/* Collapse to the slim rail (desktop) */}
          <button
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white lg:flex"
          >
            <PanelLeftClose size={18} />
          </button>
          {/* Close drawer (mobile) */}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Profile block — centered & prominent: big avatar on top, info below */}
      <Link
        href="/profile"
        onClick={onClose}
        title="View your profile"
        className="flex shrink-0 flex-col items-center gap-2 border-b border-white/15 px-4 py-5 text-center transition-colors hover:bg-white/10"
      >
        <Avatar className="size-20 shadow-lg ring-2 ring-white/40">
          {user?.avatar_url
            ? <Avatar.Image src={user.avatar_url} alt={user.username ?? ''} />
            : <Avatar.Fallback className="bg-white/20 text-2xl font-bold text-white">{initials}</Avatar.Fallback>
          }
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-white">{user?.first_name} {user?.last_name}</p>
          <p className="truncate text-xs text-white/70">@{user?.username}</p>
          {userCampus && (
            <span className="mt-1 flex items-center justify-center gap-1 text-[11px] font-medium text-white/85">
              <MapPin size={10} /> {userCampus.name}
            </span>
          )}
        </div>
      </Link>

      {/* Scrollable nav — scrollbar hidden so the solid fill stays clean (Slack/Discord style) */}
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* MENU */}
        <div>
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">Menu</p>
          <nav className="space-y-1">
            {NAV.map(({ href, icon: Icon, label, badge }) => {
              const active = href === '/feed' ? pathname === '/feed' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                    active ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  <span className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
                  <Icon size={17} className={active ? 'text-white' : 'text-white/75 group-hover:text-white'} strokeWidth={active ? 2.4 : 1.9} />
                  <span className={`flex-1 text-sm font-medium ${active ? 'text-white' : 'text-white/90'}`}>{label}</span>
                  {badge !== null && badge > 0 && (
                    <span
                      style={active ? { backgroundColor: '#fff', color: 'var(--accent)' } : undefined}
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? '' : 'bg-white/20 text-white'}`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Your campus — only the one you've joined (no other institutes listed) */}
        <div>
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">Your campus</p>
          {userCampus ? (
            <Link
              href="/campus"
              onClick={onClose}
              title={userCampus.name}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/10"
            >
              <CampusEmblem
                campus={userCampus}
                className="size-8 shrink-0 rounded-md"
                fallbackClassName="bg-white"
                fallbackStyle={{ color: 'var(--accent)' }}
                textClassName="text-[11px]"
              />
              <span className="flex-1 truncate text-sm font-semibold text-white">{userCampus.name}</span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
            </Link>
          ) : (
            <Link
              href="/campus"
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10"
            >
              <Building2 size={16} /> Join a campus
            </Link>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 space-y-2 border-t border-white/15 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <NotificationsBell placement="top start" triggerClassName="text-white/85 hover:bg-white/15 hover:text-white" />
            <ThemePicker panelClassName="bottom-12 left-0" triggerClassName="hover:bg-white/15" />
          </div>
          {/* Segmented light/dark toggle — active = white pill + accent icon (inline
              colour so it can't render white-on-white), inactive = white icon */}
          <div className="flex items-center gap-0.5 rounded-full bg-black/20 p-0.5" role="group" aria-label="Toggle theme">
            <button
              onClick={() => setTheme('light')}
              aria-label="Light mode"
              aria-pressed={!isDark}
              style={!isDark ? { backgroundColor: '#fff', color: 'var(--accent)' } : undefined}
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${!isDark ? 'shadow-sm' : 'text-white/70 hover:text-white'}`}
            >
              <Sun size={13} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              aria-label="Dark mode"
              aria-pressed={isDark}
              style={isDark ? { backgroundColor: '#fff', color: 'var(--accent)' } : undefined}
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${isDark ? 'shadow-sm' : 'text-white/70 hover:text-white'}`}
            >
              <Moon size={13} />
            </button>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
        >
          <LogOut size={16} /> Sign out
        </button>

        <div className="flex flex-wrap gap-x-2 gap-y-0.5 px-1 pt-1">
          <button onClick={openAbout} className="cursor-pointer text-[10px] text-white/60 hover:text-white hover:underline">About</button>
          <button onClick={openHelp} className="cursor-pointer text-[10px] text-white/60 hover:text-white hover:underline">Help</button>
          {LEGAL_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={onClose} className="text-[10px] text-white/60 hover:text-white hover:underline">{l.label}</Link>
          ))}
        </div>
      </div>
    </aside>
  )
}

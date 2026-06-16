'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Card, Button, Input, Tabs, Toast, Separator, Switch } from '@heroui/react'
import { Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { RegisterData } from '@/contexts/AuthContext'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { LogoMark } from '@/components/Logo'
import ThemePicker from '@/components/layout/ThemePicker'

const HAS_GOOGLE = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

const FEATURES = [
  'Share posts with your campus community',
  'Connect with students across universities',
  'Join campus-specific discussions',
  'Build your academic network',
]

export default function AuthPage() {
  const { login, loginWithGoogle, register } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  // login state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  // register state
  const [reg, setReg] = useState<RegisterData>({
    username: '', email: '', password: '', first_name: '', last_name: '',
  })
  const [showRegPw, setShowRegPw] = useState(false)

  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!username || !password) return
    setLoading(true)
    try {
      await login(username, password)
      router.replace('/feed')
    } catch {
      Toast.toast.danger('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!Object.values(reg).every(Boolean)) return
    setLoading(true)
    try {
      await register(reg)
      router.replace('/feed')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { username?: string[] } } })
        ?.response?.data?.username?.[0] ?? 'Registration failed'
      Toast.toast.danger(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (accessToken: string) => {
    setLoading(true)
    try {
      await loginWithGoogle(accessToken)
      router.replace('/feed')
    } catch {
      Toast.toast.danger('Google sign-in failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left: visual panel — solid fill in the selected theme colour ── */}
      <div
        className="relative hidden w-[58%] flex-col items-center justify-center overflow-hidden p-12 text-center text-white lg:flex"
        style={{ backgroundColor: 'var(--sidebar)' }}
      >
        {/* subtle white circles add depth to the solid fill */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-48 w-48 rounded-full bg-white/4" />

        {/* Centred brand + hero — one cohesive column, no left-aligned dead space */}
        <div className="relative z-10 flex max-w-md flex-col items-center gap-7">
          {/* logo only (no tile), large */}
          <div className="flex flex-col items-center gap-4">
            <LogoMark size={96} className="drop-shadow-lg" />
            <span
              className="text-3xl font-bold tracking-tight text-white"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Campus Connect
            </span>
          </div>

          {/* hero copy */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
              Your campus, your community
            </p>
            <h1
              className="text-4xl font-bold leading-tight text-white"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Where campus life connects us all.
            </h1>
            <p className="mx-auto max-w-sm text-base leading-relaxed text-white/80">
              Join thousands of students sharing experiences, ideas, and moments across campuses.
            </p>
          </div>

          {/* feature list — centred block, rows left-aligned within */}
          <ul className="mx-auto flex w-fit flex-col gap-2.5 text-left">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* footer pinned to the bottom */}
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white/45">
          © {new Date().getFullYear()} Campus Connect · All rights reserved
        </p>
      </div>

      {/* ── Right: auth form ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto bg-[--page-bg] px-6 py-10">
        {/* Same accent-glow + campus-doodle backdrop the app uses, contained to this panel */}
        <div className="auth-backdrop" aria-hidden="true" />

        {/* Theme controls — top right of auth panel. Higher z than the form card
            (z-10) so the open theme-picker panel layers above it, not behind. */}
        <div className="absolute right-5 top-5 z-30 flex items-center gap-1">
          <ThemePicker />
          <div className="flex items-center gap-1.5">
            <Sun size={13} className="text-[--muted]" />
            <Switch
              size="sm"
              isSelected={theme === 'dark'}
              onChange={(selected: boolean) => setTheme(selected ? 'dark' : 'light')}
            >
              <Switch.Content>
                <Switch.Control><Switch.Thumb /></Switch.Control>
              </Switch.Content>
            </Switch>
            <Moon size={13} className="text-[--muted]" />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-100 space-y-6">
          {/* mobile brand */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <LogoMark size={44} />
            <span className="font-bold text-[--foreground]">Campus Connect</span>
          </div>

          {/* Google sign-in */}
          <Card className="border border-[--surface-secondary]">
            <Card.Content className="space-y-4 pt-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[--foreground]">Welcome</h2>
                <p className="text-sm text-[--muted]">Sign in to your account or create one</p>
              </div>

              {HAS_GOOGLE && (
                <>
                  <GoogleSignInButton
                    onSuccess={handleGoogleSuccess}
                    onError={() => Toast.toast.danger('Google sign-in was cancelled')}
                    disabled={loading}
                  />
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-[--muted]">or with email</span>
                    <Separator className="flex-1" />
                  </div>
                </>
              )}

              {/* Login / Register tabs */}
              <Tabs>
                <Tabs.List>
                  <Tabs.Tab id="login">Sign In</Tabs.Tab>
                  <Tabs.Tab id="register">Create Account</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel id="login">
                  <form onSubmit={handleLogin} className="mt-4 space-y-3">
                    <Input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      fullWidth
                      autoComplete="username"
                    />
                    <div className="relative">
                      <Input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        fullWidth
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted]"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Button
                      type="submit"
                      isDisabled={!username || !password || loading}
                      fullWidth
                      className="bg-[--accent] text-[--accent-foreground]"
                    >
                      {loading ? 'Signing in…' : 'Sign In'}
                    </Button>
                  </form>
                </Tabs.Panel>

                <Tabs.Panel id="register">
                  <form onSubmit={handleRegister} className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="First name"
                        value={reg.first_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReg(r => ({ ...r, first_name: e.target.value }))}
                        fullWidth
                      />
                      <Input
                        placeholder="Last name"
                        value={reg.last_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReg(r => ({ ...r, last_name: e.target.value }))}
                        fullWidth
                      />
                    </div>
                    <Input
                      placeholder="Username"
                      value={reg.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReg(r => ({ ...r, username: e.target.value }))}
                      fullWidth
                      autoComplete="username"
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={reg.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReg(r => ({ ...r, email: e.target.value }))}
                      fullWidth
                      autoComplete="email"
                    />
                    <div className="relative">
                      <Input
                        type={showRegPw ? 'text' : 'password'}
                        placeholder="Password"
                        value={reg.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReg(r => ({ ...r, password: e.target.value }))}
                        fullWidth
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted]"
                      >
                        {showRegPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Button
                      type="submit"
                      isDisabled={!Object.values(reg).every(Boolean) || loading}
                      fullWidth
                      className="bg-[--accent] text-[--accent-foreground]"
                    >
                      {loading ? 'Creating account…' : 'Create Account'}
                    </Button>
                  </form>
                </Tabs.Panel>
              </Tabs>
            </Card.Content>
          </Card>

          <p className="text-center text-xs text-[--muted]">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      <Toast.Provider placement="top" />
    </div>
  )
}

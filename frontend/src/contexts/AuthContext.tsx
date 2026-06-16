'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api, { googleLogin as googleLoginApi } from '@/lib/api'
import type { User, ProfileUpdate } from '@/types'

export interface RegisterData {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login(username: string, password: string): Promise<void>
  loginWithGoogle(credential: string): Promise<void>
  register(data: RegisterData): Promise<void>
  logout(): void
  refreshUser(): Promise<void>
  updateProfile(data: ProfileUpdate): Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    const { data } = await api.get<User>('/auth/me/')
    setUser(data)
    return data
  }

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      fetchUser().catch(() => typeof window !== 'undefined' && localStorage.clear()).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const { data } = await api.post<{ access: string; refresh: string }>('/auth/login/', { username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    await fetchUser()
  }

  const register = async (registerData: RegisterData) => {
    await api.post('/auth/register/', registerData)
    await login(registerData.username, registerData.password)
  }

  const loginWithGoogle = async (credential: string) => {
    const data = await googleLoginApi(credential)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    await fetchUser()
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const refreshUser = async () => { await fetchUser() }

  const updateProfile = async (data: ProfileUpdate) => {
    const { data: updated } = await api.patch<User>('/auth/me/', data)
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@heroui/react'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    router.replace(token ? '/feed' : '/login')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
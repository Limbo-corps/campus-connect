'use client'

import { useState } from 'react'
import { Card, Button, Chip } from '@heroui/react'
import { MapPin, Users, CheckCircle2 } from 'lucide-react'
import { Toast } from '@heroui/react'
import api from '@/lib/api'
import type { Campus } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { campusImage, IMG_FADE } from '@/lib/banners'
import CampusEmblem from '@/components/campus/CampusEmblem'

interface Props {
  campus: Campus
  currentCampusId?: string
  onMutate(): void
}

export default function CampusCard({ campus, currentCampusId, onMutate }: Props) {
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const isMember = currentCampusId === campus.id

  const join = async () => {
    setLoading(true)
    try {
      await api.post(`/campuses/${campus.id}/join/`)
      Toast.toast.success(`Joined ${campus.name}!`)
      await refreshUser()
      onMutate()
    } catch {
      Toast.toast.danger('Failed to join campus')
    } finally {
      setLoading(false)
    }
  }

  const leave = async () => {
    setLoading(true)
    try {
      await api.post('/campuses/leave/')
      Toast.toast.success(`Left ${campus.name}`)
      await refreshUser()
      onMutate()
    } catch {
      Toast.toast.danger('Failed to leave campus')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`group flex flex-col gap-0 border shadow-sm transition-all hover:shadow-md ${isMember ? 'border-[--accent]/40' : 'border-[--surface-secondary]'}`}>
      {/* Real campus photo when set, else a themed fallback */}
      <div
        className="h-20 rounded-t-3xl bg-cover bg-center"
        style={{ backgroundImage: `${IMG_FADE}, url('${campus.banner_url || campusImage(campus.name)}')` }}
      />

      {/* Avatar initial + chip */}
      <div className="-mt-5 flex items-end justify-between">
        <CampusEmblem
          campus={campus}
          className="size-12 rounded-lg border-2 border-[--surface] shadow-sm"
          textClassName="text-sm"
        />
        {isMember && (
          <Chip size="sm" color="success" variant="soft" className="text-[10px]">
            <CheckCircle2 size={10} className="mr-0.5 inline" />
            Joined
          </Chip>
        )}
      </div>

      <Card.Header className="gap-1 pt-2">
        <Card.Title>{campus.name}</Card.Title>
        {(campus.city || campus.state) && (
          <Card.Description className="flex items-center gap-1 text-xs">
            <MapPin size={10} />
            {[campus.city, campus.state].filter(Boolean).join(', ')}
          </Card.Description>
        )}
        {campus.description && (
          <Card.Description className="line-clamp-2 text-xs leading-relaxed">
            {campus.description}
          </Card.Description>
        )}
      </Card.Header>

      <Card.Footer className="mt-auto justify-between border-t border-[--surface-secondary] pt-3">
        <span className="flex items-center gap-1 text-xs text-[--muted]">
          <Users size={12} />
          {campus.students_count.toLocaleString()} students
        </span>
        <Button
          size="sm"
          variant={isMember ? 'ghost' : 'outline'}
          isDisabled={loading}
          onPress={isMember ? leave : join}
          className={!isMember ? 'border-[--accent] text-[--accent] hover:bg-[--accent] hover:text-white' : ''}
        >
          {loading ? '…' : isMember ? 'Leave' : 'Join'}
        </Button>
      </Card.Footer>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { Card, Skeleton, Chip, Breadcrumbs, Alert } from '@heroui/react'
import { Building2, Users, MapPin } from 'lucide-react'
import { useCampuses } from '@/hooks/useCampuses'
import CampusCard from '@/components/campus/CampusCard'
import { useAuth } from '@/contexts/AuthContext'
import { campusImage, IMG_FADE } from '@/lib/banners'
import CampusEmblem from '@/components/campus/CampusEmblem'
import InlineSearch from '@/components/layout/InlineSearch'

export default function CampusPage() {
  const { user } = useAuth()
  const { campuses, loading, mutate } = useCampuses()
  const [query, setQuery] = useState('')

  const userCampusId = (user as unknown as { campus?: string })?.campus
  const userCampus = campuses.find(c => c.id === userCampusId)
  const totalStudents = campuses.reduce((acc, c) => acc + c.students_count, 0)

  const filtered = query
    ? campuses.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.city?.toLowerCase().includes(query.toLowerCase()) ||
        c.state?.toLowerCase().includes(query.toLowerCase())
      )
    : campuses

  return (
    <div className="space-y-5">
      {/* Breadcrumbs */}
      <Breadcrumbs>
        <Breadcrumbs.Item href="/feed">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item>Campuses</Breadcrumbs.Item>
      </Breadcrumbs>

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[--foreground]">Campuses</h1>
          <p className="mt-1 text-sm text-[--muted]">
            {userCampus
              ? `You're a member of ${userCampus.name}`
              : 'Join a campus to connect with your community'}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <Card className="border border-[--surface-secondary]">
            <Card.Content className="flex items-center gap-2 py-2 px-3">
              <Building2 size={14} className="text-[--accent]" />
              <div>
                <p className="text-xs text-[--muted]">Campuses</p>
                <p className="text-sm font-bold text-[--foreground]">{campuses.length}</p>
              </div>
            </Card.Content>
          </Card>
          <Card className="border border-[--surface-secondary]">
            <Card.Content className="flex items-center gap-2 py-2 px-3">
              <Users size={14} className="text-[--accent]" />
              <div>
                <p className="text-xs text-[--muted]">Students</p>
                <p className="text-sm font-bold text-[--foreground]">{totalStudents.toLocaleString()}</p>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Your campus highlight — clean photo banner with emblem + text below */}
      {userCampus && (
        <Card className="overflow-hidden border border-[--accent]/40 shadow-sm">
          <div
            className="h-24 bg-cover bg-center"
            style={{ backgroundImage: `${IMG_FADE}, url('${userCampus.banner_url || campusImage(userCampus.name)}')` }}
          />
          <div className="flex items-center gap-4 px-5 pb-4 -mt-7">
            <CampusEmblem
              campus={userCampus}
              className="size-14 rounded-xl border-2 border-[--surface] shadow-md"
              textClassName="text-lg"
            />
            <div className="flex flex-1 flex-col gap-0.5 pt-7">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[--foreground]">{userCampus.name}</h3>
                <Chip size="sm" color="success" variant="soft" className="text-[10px]">Your Campus</Chip>
              </div>
              {(userCampus.city || userCampus.state) && (
                <p className="flex items-center gap-1 text-xs text-[--muted]">
                  <MapPin size={10} />
                  {[userCampus.city, userCampus.state].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="text-xs text-[--muted]">
                {userCampus.students_count.toLocaleString()} students
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Your campus alert */}
      {userCampus && (
        <Alert status="accent">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>You&apos;re a member of {userCampus.name}</Alert.Title>
            <Alert.Description>You can only join one campus at a time. Leave your current campus first to join another.</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {/* All campuses grid */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[--muted]">
            {query ? `Results for "${query}" (${filtered.length})` : `All Campuses (${campuses.length})`}
          </h2>
          <InlineSearch
            value={query}
            onChange={setQuery}
            placeholder="Search by name or location…"
            label="Search campuses"
            expandedWidth="w-64"
          />
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border border-dashed border-[--surface-tertiary]">
            <Card.Content className="flex flex-col items-center py-16 text-center">
              <Building2 size={32} className="mb-3 text-[--muted]" />
              <p className="font-medium text-[--foreground]">No campuses yet</p>
              <p className="mt-1 text-sm text-[--muted]">Campuses will appear here once created.</p>
            </Card.Content>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(campus => (
              <CampusCard
                key={campus.id}
                campus={campus}
                currentCampusId={userCampusId}
                onMutate={mutate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

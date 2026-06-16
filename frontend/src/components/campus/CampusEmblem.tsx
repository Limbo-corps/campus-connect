'use client'

import type { CSSProperties } from 'react'
import { Avatar } from '@heroui/react'
import type { Campus } from '@/types'

/** Up to two initials from the campus name (e.g. "IIT Jodhpur" → "IJ"). */
function initials(name: string): string {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean)
  const value = parts.slice(0, 2).map(w => w[0]).join('') || name.slice(0, 2)
  return value.toUpperCase()
}

interface Props {
  campus: Pick<Campus, 'name' | 'logo_url'>
  /** classes for the Avatar root (size, rounding, border, …) */
  className?: string
  /** classes for the initials text in the fallback */
  textClassName?: string
  /** override the default accent fill (e.g. when sitting on an accent surface) */
  fallbackClassName?: string
  /** inline style for the fallback (use for guaranteed colours via CSS vars) */
  fallbackStyle?: CSSProperties
}

/**
 * Campus badge: shows the real logo when `logo_url` is set, otherwise a SOLID
 * square tinted with the current theme accent (no gradient) and the campus
 * initials. The solid colour follows whatever accent the user picks.
 */
export default function CampusEmblem({ campus, className, textClassName, fallbackClassName, fallbackStyle }: Props) {
  return (
    <Avatar className={className}>
      {campus.logo_url ? <Avatar.Image src={campus.logo_url} alt={campus.name} /> : null}
      <Avatar.Fallback
        style={fallbackStyle}
        className={`font-extrabold ${fallbackClassName ?? 'bg-[--accent] text-[--accent-foreground]'} ${textClassName ?? ''}`}
      >
        {initials(campus.name)}
      </Avatar.Fallback>
    </Avatar>
  )
}

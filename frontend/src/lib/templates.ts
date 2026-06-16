/**
 * Profile templates — each is a banner vibe a user can pick for their profile.
 * Stored on user.profile_template. Images are clean photos (no color wash).
 */

const Q = '?auto=format&fit=crop&w=1200&q=80'

export interface ProfileTemplate {
  key: string
  label: string
  /** playful description for the picker */
  vibe: string
  /** banner background image */
  banner: string
  /** small emoji badge shown on the picker tile */
  emoji: string
}

export const PROFILE_TEMPLATES: ProfileTemplate[] = [
  {
    key: 'aurora',
    label: 'Aurora',
    vibe: 'campus from above ✨',
    emoji: '🌆',
    banner: `https://images.unsplash.com/photo-1523240795612-9a054b0db644${Q}`,
  },
  {
    key: 'library',
    label: 'Library Rat',
    vibe: 'lives in the reading hall 📚',
    emoji: '📚',
    banner: `https://images.unsplash.com/photo-1591123720164-de1348028b2d${Q}`,
  },
  {
    key: 'quad',
    label: 'Quad Life',
    vibe: 'always on the lawn 🌿',
    emoji: '🌿',
    banner: `https://images.unsplash.com/photo-1498243691581-b145c3f54a5a${Q}`,
  },
  {
    key: 'lab',
    label: 'Lab Coded',
    vibe: 'building the future 🔬',
    emoji: '🔬',
    banner: `https://images.unsplash.com/photo-1581092160562-40aa08e78837${Q}`,
  },
  {
    key: 'grad',
    label: 'Future Grad',
    vibe: 'caps in the air 🎓',
    emoji: '🎓',
    banner: `https://images.unsplash.com/photo-1523050854058-8df90110c9f1${Q}`,
  },
  {
    key: 'classic',
    label: 'Old School',
    vibe: 'pillars & prestige 🏛️',
    emoji: '🏛️',
    banner: `https://images.unsplash.com/photo-1541339907198-e08756dedf3f${Q}`,
  },
]

export const DEFAULT_TEMPLATE = PROFILE_TEMPLATES[0]

export function getTemplate(key?: string | null): ProfileTemplate {
  return PROFILE_TEMPLATES.find(t => t.key === key) ?? DEFAULT_TEMPLATE
}

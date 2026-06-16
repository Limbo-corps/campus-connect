/**
 * DiceBear avatar helpers (https://www.dicebear.com) — free HTTP API, no key.
 * Cute, Duolingo-style avatars for users + clean generated emblems for campuses.
 * The selected avatar URL is persisted on the user's `avatar_url` field.
 */

const BASE = 'https://api.dicebear.com/9.x'

export interface AvatarStyle {
  /** DiceBear style id */
  id: string
  /** friendly label for the picker */
  label: string
  /** playful one-liner */
  vibe: string
}

/** Curated cute styles, in picker order. */
export const AVATAR_STYLES: AvatarStyle[] = [
  { id: 'adventurer',      label: 'Adventurer', vibe: 'main-character energy' },
  { id: 'fun-emoji',       label: 'Fun Emoji',  vibe: 'pure chaos, love it' },
  { id: 'big-smile',       label: 'Big Smile',  vibe: 'always vibing' },
  { id: 'lorelei',         label: 'Lorelei',    vibe: 'soft aesthetic' },
  { id: 'micah',           label: 'Micah',      vibe: 'clean & cool' },
  { id: 'notionists',      label: 'Notionist',  vibe: 'desk warrior' },
  { id: 'bottts',          label: 'Bottts',     vibe: 'beep boop 🤖' },
  { id: 'thumbs',          label: 'Thumbs',     vibe: 'big yes' },
  { id: 'avataaars',       label: 'Avataaars',  vibe: 'classic throwback' },
  { id: 'open-peeps',      label: 'Peeps',      vibe: 'doodle gang' },
]

/** Build a DiceBear avatar URL for a given style + seed. */
export function dicebearUrl(style: string, seed: string): string {
  const s = encodeURIComponent(seed || 'campus')
  return `${BASE}/${style}/svg?seed=${s}&radius=50&backgroundType=gradientLinear`
}

/** A few quick seed suggestions per style so the picker shows variety. */
export const SEED_POOL = [
  'Mochi', 'Pixel', 'Nova', 'Bubbles', 'Ziggy', 'Pepper',
  'Cosmo', 'Sunny', 'Maple', 'Echo', 'Loki', 'Biscuit',
]

/** Detect whether a stored avatar_url is a DiceBear-generated one. */
export function isDicebear(url?: string | null): boolean {
  return !!url && url.includes('api.dicebear.com')
}

/**
 * Clean, logo-like emblem for a campus. Uses the "initials" style with the
 * campus initials over a deterministic gradient — original artwork, no
 * trademarked institutional logos.
 */
export function campusEmblem(name: string): string {
  const initials = name
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || name.slice(0, 2).toUpperCase()
  const seed = encodeURIComponent(name)
  return `${BASE}/initials/svg?seed=${seed}&radius=20&fontWeight=700&backgroundType=gradientLinear&chars=2&seedText=${encodeURIComponent(initials)}`
}

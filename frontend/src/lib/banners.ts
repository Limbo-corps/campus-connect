/**
 * Campus / university themed banner images (Unsplash, free to use).
 * Each is paired with a pink-tinted gradient overlay applied at the call site
 * so the imagery stays cohesive with the magenta accent theme.
 */

const Q = '?auto=format&fit=crop&w=1200&q=80'

// Curated university / campus / student-life photos
export const CAMPUS_IMAGES = [
  `https://images.unsplash.com/photo-1562774053-701939374585${Q}`, // university courtyard
  `https://images.unsplash.com/photo-1541339907198-e08756dedf3f${Q}`, // columned hall
  `https://images.unsplash.com/photo-1607237138185-eedd9c632b0b${Q}`, // modern campus
  `https://images.unsplash.com/photo-1498243691581-b145c3f54a5a${Q}`, // students walking
  `https://images.unsplash.com/photo-1523050854058-8df90110c9f1${Q}`, // graduation
  `https://images.unsplash.com/photo-1591123720164-de1348028b2d${Q}`, // library
  `https://images.unsplash.com/photo-1592280771190-3e2e4d571952${Q}`, // lecture hall
  `https://images.unsplash.com/photo-1606761568499-6d2451b23c66${Q}`, // study desks
]

/** The main hero banner used on the profile page. */
export const PROFILE_BANNER = `https://images.unsplash.com/photo-1523240795612-9a054b0db644${Q}`

/** The campus highlight banner / feed mini-banner. */
export const CAMPUS_HERO = `https://images.unsplash.com/photo-1562774053-701939374585${Q}`

/** The full-bleed auth panel image. */
export const AUTH_BANNER = `https://images.unsplash.com/photo-1523050854058-8df90110c9f1${Q}`

/** Pick a deterministic campus image based on a string (e.g. campus name). */
export function campusImage(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return CAMPUS_IMAGES[hash % CAMPUS_IMAGES.length]
}

/**
 * Overlays are intentionally NEUTRAL (no color wash) — images show their true
 * colors. Scrims are only applied where text sits ON the photo, just enough
 * for legibility.
 */

/** Subtle bottom fade so a clean photo blends into the card body beneath it. */
export const IMG_FADE =
  'linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.18))'

/** Neutral scrim for short text strips on a photo (e.g. campus highlight). */
export const READ_SCRIM =
  'linear-gradient(90deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15))'

/** Deeper neutral scrim for the large auth hero panel (lots of text). */
export const HERO_SCRIM =
  'linear-gradient(135deg, rgba(15,10,25,0.74), rgba(20,12,30,0.55))'

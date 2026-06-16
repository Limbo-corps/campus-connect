/**
 * Accent theming — the whole app's tint is driven by a single hue value
 * (--app-hue on <html>). Lightness & chroma stay constant across presets so
 * every colour reads with the same weight (standard colour-system principle);
 * only the hue rotates around the wheel.
 */

export interface AccentPreset {
  name: string
  hue: number
}

export const DEFAULT_HUE = 328.26
export const STORAGE_KEY = 'app-hue'

/** Evenly-spaced, harmonious presets around the colour wheel. */
export const ACCENT_PRESETS: AccentPreset[] = [
  { name: 'Magenta', hue: 328.26 },
  { name: 'Pink', hue: 350 },
  { name: 'Rose', hue: 12 },
  { name: 'Red', hue: 27 },
  { name: 'Orange', hue: 55 },
  { name: 'Amber', hue: 75 },
  { name: 'Lime', hue: 128 },
  { name: 'Green', hue: 152 },
  { name: 'Emerald', hue: 165 },
  { name: 'Teal', hue: 185 },
  { name: 'Cyan', hue: 210 },
  { name: 'Sky', hue: 235 },
  { name: 'Blue', hue: 258 },
  { name: 'Indigo', hue: 275 },
  { name: 'Violet', hue: 293 },
  { name: 'Purple', hue: 310 },
]

/** A representative swatch colour for a hue (matches the live --accent recipe). */
export function swatch(hue: number): string {
  return `oklch(62.04% 0.195 ${hue})`
}

/** Nearest named preset to a hue (for displaying the active label). */
export function nearestPreset(hue: number): AccentPreset {
  let best = ACCENT_PRESETS[0]
  let bestDist = 360
  for (const p of ACCENT_PRESETS) {
    const d = Math.min(Math.abs(p.hue - hue), 360 - Math.abs(p.hue - hue))
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best
}

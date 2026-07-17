// @/lib/chat/themes.ts
// Per-conversation chat themes, persisted client-side in localStorage. Supports
// preset gradients and custom uploaded images with brightness / blur / dim
// controls — no backend required.

import type { CSSProperties } from "react";

export interface ChatTheme {
  /** Preset id, or "custom" when an image is used. */
  id: string;
  /** CSS background value for a preset (gradient/color). Ignored for custom. */
  background?: string;
  /** Data URL of an uploaded image (custom themes only). */
  image?: string | null;
  /** 0.2–1.6 — multiplies image brightness. */
  brightness?: number;
  /** 0–20px — blur applied to the background image. */
  blur?: number;
  /** 0–0.85 — dark scrim opacity laid over the background for readability. */
  dim?: number;
}

export interface ThemePreset {
  id: string;
  label: string;
  background: string;
  /** Small swatch preview used in the picker. */
  swatch: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    label: "Default",
    background: "",
    swatch: "var(--surface)",
  },
  {
    id: "midnight",
    label: "Midnight",
    background:
      "radial-gradient(circle at 20% 20%, #312e81 0%, transparent 55%), linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
    swatch: "linear-gradient(160deg, #0f172a, #1e1b4b)",
  },
  {
    id: "aurora",
    label: "Aurora",
    background:
      "linear-gradient(160deg, #0b3866 0%, #1d7874 45%, #071e3d 100%)",
    swatch: "linear-gradient(160deg, #1d7874, #0b3866)",
  },
  {
    id: "sunset",
    label: "Sunset",
    background:
      "linear-gradient(160deg, #7f1d1d 0%, #b45309 50%, #4c1d95 100%)",
    swatch: "linear-gradient(160deg, #b45309, #7f1d1d)",
  },
  {
    id: "bubblegum",
    label: "Bubblegum",
    background:
      "linear-gradient(160deg, #831843 0%, #be185d 50%, #6b21a8 100%)",
    swatch: "linear-gradient(160deg, #be185d, #6b21a8)",
  },
  {
    id: "forest",
    label: "Forest",
    background:
      "linear-gradient(160deg, #14532d 0%, #166534 50%, #052e16 100%)",
    swatch: "linear-gradient(160deg, #166534, #052e16)",
  },
  {
    id: "mono",
    label: "Charcoal",
    background: "linear-gradient(160deg, #1c1c1e 0%, #2c2c2e 100%)",
    swatch: "linear-gradient(160deg, #2c2c2e, #1c1c1e)",
  },
];

export const DEFAULT_THEME: ChatTheme = { id: "default" };

const KEY_PREFIX = "cc:chat-theme:";
const EVENT = "cc:chat-theme-change";

function keyFor(conversationId: string) {
  return `${KEY_PREFIX}${conversationId}`;
}

export function getTheme(conversationId: string): ChatTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(keyFor(conversationId));
    if (!raw) return DEFAULT_THEME;
    return { ...DEFAULT_THEME, ...(JSON.parse(raw) as ChatTheme) };
  } catch {
    return DEFAULT_THEME;
  }
}

export function setTheme(conversationId: string, theme: ChatTheme): void {
  if (typeof window === "undefined") return;
  try {
    if (theme.id === "default" && !theme.image) {
      window.localStorage.removeItem(keyFor(conversationId));
    } else {
      window.localStorage.setItem(keyFor(conversationId), JSON.stringify(theme));
    }
    // Notify listeners in this tab (storage event only fires cross-tab).
    window.dispatchEvent(
      new CustomEvent(EVENT, { detail: { conversationId } }),
    );
  } catch {
    /* quota / serialization errors are non-fatal */
  }
}

export function onThemeChange(fn: (conversationId: string) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const id = (e as CustomEvent<{ conversationId: string }>).detail
      ?.conversationId;
    fn(id);
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/**
 * Build the inline styles for a theme: the base layer (gradient or image) and
 * an overlay scrim. Returned as two style objects the thread pane stacks.
 */
export function themeLayerStyles(theme: ChatTheme): {
  base: CSSProperties;
  scrim: CSSProperties;
} {
  if (theme.image) {
    return {
      base: {
        backgroundImage: `url(${theme.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: `brightness(${theme.brightness ?? 1}) blur(${theme.blur ?? 0}px)`,
        transform: theme.blur ? "scale(1.06)" : undefined, // hide blur edges
      },
      scrim: {
        backgroundColor: `rgba(0,0,0,${theme.dim ?? 0.35})`,
      },
    };
  }

  const preset = THEME_PRESETS.find((p) => p.id === theme.id);
  return {
    base: preset?.background ? { backgroundImage: preset.background } : {},
    scrim: {},
  };
}

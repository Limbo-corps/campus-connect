// @/lib/chat/status.ts
// Client-side user "status" (Discord-style): presence mode + optional custom
// status text/emoji, persisted in localStorage. This drives the local UI only;
// broadcasting status to other users would require backend support.

export type StatusMode = "online" | "idle" | "dnd" | "invisible";

export interface UserStatus {
  mode: StatusMode;
  /** Optional custom status text, e.g. "cramming for finals". */
  text?: string;
  /** Optional emoji shown next to the custom text. */
  emoji?: string;
}

export interface StatusOption {
  mode: StatusMode;
  label: string;
  /** Tailwind text color class for the presence dot. */
  color: string;
  /** Hex for inline dots where a class won't do. */
  hex: string;
  description: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  {
    mode: "online",
    label: "Online",
    color: "text-emerald-500",
    hex: "#10b981",
    description: "Available to chat",
  },
  {
    mode: "idle",
    label: "Idle",
    color: "text-amber-500",
    hex: "#f59e0b",
    description: "Away from keyboard",
  },
  {
    mode: "dnd",
    label: "Do Not Disturb",
    color: "text-rose-500",
    hex: "#f43f5e",
    description: "Mute notifications",
  },
  {
    mode: "invisible",
    label: "Invisible",
    color: "text-slate-400",
    hex: "#94a3b8",
    description: "Appear offline",
  },
];

export const DEFAULT_STATUS: UserStatus = { mode: "online" };

const KEY = "cc:user-status";
const EVENT = "cc:user-status-change";

export function getStatus(): UserStatus {
  if (typeof window === "undefined") return DEFAULT_STATUS;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_STATUS, ...(JSON.parse(raw) as UserStatus) } : DEFAULT_STATUS;
  } catch {
    return DEFAULT_STATUS;
  }
}

export function setStatus(status: UserStatus): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(status));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* non-fatal */
  }
}

export function onStatusChange(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

export function statusOption(mode: StatusMode): StatusOption {
  return STATUS_OPTIONS.find((o) => o.mode === mode) ?? STATUS_OPTIONS[0];
}

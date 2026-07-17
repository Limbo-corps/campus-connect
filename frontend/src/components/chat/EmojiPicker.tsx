"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EMOJI_CATEGORIES } from "@/lib/chat/emoji";

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}

/**
 * A self-contained emoji panel (category tabs + search grid). The parent owns
 * open/close state and positioning; this just renders the panel body.
 */
export function EmojiPicker({ onPick, onClose, className }: EmojiPickerProps) {
  const [active, setActive] = useState(EMOJI_CATEGORIES[0].key);
  const [query, setQuery] = useState("");

  const emojis = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      // Simple search: flatten everything (emoji have no names here, so search
      // just widens the grid to all categories).
      return EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    }
    return EMOJI_CATEGORIES.find((c) => c.key === active)?.emojis ?? [];
  }, [active, query]);

  return (
    <div
      className={`flex h-72 w-72 flex-col overflow-hidden rounded-2xl border border-[--surface-secondary] bg-[--surface] shadow-2xl ${className ?? ""}`}
    >
      {/* Search */}
      <div className="border-b border-[--surface-secondary] p-2">
        <label className="flex items-center gap-2 rounded-lg bg-[--surface-secondary]/50 px-2 py-1.5">
          <Search size={13} className="text-[--muted]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji"
            className="w-full bg-transparent text-xs text-[--foreground] outline-none placeholder:text-[--muted]"
          />
        </label>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        <div className="grid grid-cols-8 gap-0.5">
          {emojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              type="button"
              onClick={() => {
                onPick(emoji);
                onClose?.();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-transform hover:scale-110 hover:bg-[--surface-secondary]"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      {!query && (
        <div className="flex items-center justify-between border-t border-[--surface-secondary] px-1 py-1">
          {EMOJI_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setActive(c.key)}
              aria-label={c.label}
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-base transition-colors ${
                active === c.key
                  ? "bg-[--accent]/15"
                  : "opacity-60 hover:opacity-100 hover:bg-[--surface-secondary]"
              }`}
            >
              {c.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

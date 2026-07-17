"use client";

import React from "react";

import { STICKERS } from "@/lib/chat/emoji";

interface StickerPickerProps {
  onPick: (sticker: string) => void;
  onClose?: () => void;
  className?: string;
}

/**
 * A tray of large "stickers". Picking one sends an emoji-only message, which
 * the thread renders jumbo (see MessageItem + isEmojiOnly).
 */
export function StickerPicker({ onPick, onClose, className }: StickerPickerProps) {
  return (
    <div
      className={`w-72 overflow-hidden rounded-2xl border border-[--surface-secondary] bg-[--surface] shadow-2xl ${className ?? ""}`}
    >
      <div className="border-b border-[--surface-secondary] px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[--muted]">
          Stickers
        </p>
      </div>
      <div className="grid max-h-60 grid-cols-5 gap-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        {STICKERS.map((sticker, i) => (
          <button
            key={`${sticker}-${i}`}
            type="button"
            onClick={() => {
              onPick(sticker);
              onClose?.();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-3xl transition-transform hover:scale-110 hover:bg-[--surface-secondary]"
          >
            {sticker}
          </button>
        ))}
      </div>
    </div>
  );
}

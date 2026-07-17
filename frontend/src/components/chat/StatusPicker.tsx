"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  STATUS_OPTIONS,
  getStatus,
  setStatus,
  statusOption,
  type StatusMode,
  type UserStatus,
} from "@/lib/chat/status";

const QUICK_EMOJIS = ["💬", "📚", "🎧", "🎮", "😴", "🍕", "🔥", "🎉"];

/** Small dropdown to set presence mode + a custom status. Self-persisting. */
export function StatusPicker() {
  const [open, setOpen] = useState(false);
  const [status, setLocal] = useState<UserStatus>({ mode: "online" });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync status from localStorage on mount
    setLocal(getStatus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const update = (next: UserStatus) => {
    setLocal(next);
    setStatus(next);
  };

  const chooseMode = (mode: StatusMode) => update({ ...status, mode });

  const current = statusOption(status.mode);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-[--surface-secondary]/50"
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: current.hex }}
        />
        <span className="min-w-0 flex-1 truncate text-[10px] text-[--muted]">
          {status.text
            ? `${status.emoji ?? ""} ${status.text}`.trim()
            : current.label}
        </span>
        <ChevronDown size={12} className="shrink-0 text-[--muted]" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-60 overflow-hidden rounded-xl border border-[--surface-secondary] bg-[--surface] p-1.5 shadow-2xl">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.mode}
              type="button"
              onClick={() => chooseMode(o.mode)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[--surface-secondary]"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: o.hex }}
              />
              <span className="flex-1">
                <span className="block text-xs font-semibold text-[--foreground]">
                  {o.label}
                </span>
                <span className="block text-[10px] text-[--muted]">
                  {o.description}
                </span>
              </span>
              {status.mode === o.mode && (
                <Check size={13} className="text-[--accent]" />
              )}
            </button>
          ))}

          <div className="mt-1.5 border-t border-[--surface-secondary] px-1.5 pt-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[--muted]">
              Custom status
            </p>
            <div className="flex items-center gap-1.5 rounded-lg border border-[--surface-secondary] px-2 py-1">
              <span className="text-sm">{status.emoji || "💬"}</span>
              <input
                value={status.text ?? ""}
                onChange={(e) => update({ ...status, text: e.target.value })}
                placeholder="What's happening?"
                maxLength={60}
                className="w-full bg-transparent text-xs text-[--foreground] outline-none placeholder:text-[--muted]"
              />
              {status.text && (
                <button
                  type="button"
                  onClick={() => update({ ...status, text: "", emoji: undefined })}
                  className="text-[10px] text-[--muted] hover:text-danger"
                >
                  clear
                </button>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => update({ ...status, emoji: e })}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-base transition-colors hover:bg-[--surface-secondary] ${
                    status.emoji === e ? "bg-[--accent]/15" : ""
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

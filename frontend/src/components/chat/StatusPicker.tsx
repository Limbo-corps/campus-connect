"use client";

import React, { useEffect, useState } from "react";
import { Dropdown, Input, Label, Separator, Button } from "@heroui/react";
import { Check, ChevronDown, X } from "lucide-react";

import * as chatApi from "@/lib/chat/api";
import {
  STATUS_OPTIONS,
  statusOption,
  type StatusMode,
} from "@/lib/chat/status";

const QUICK_EMOJIS = ["💬", "📚", "🎧", "🎮", "😴", "🍕", "🔥", "🎉"];

export function StatusPicker() {
  const [mode, setMode] = useState<StatusMode>("online");
  const [text, setText] = useState<string>("");
  const [emoji, setEmoji] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch current user presence on mount
  useEffect(() => {
    let isMounted = true;
    chatApi
      .getPresence()
      .then((p) => {
        if (!isMounted || !p) return;
        setMode((p.status as StatusMode) || "online");
        setText(p.custom_status || "");
        setEmoji(p.custom_status_emoji || undefined);
      })
      .catch((err) => console.error("Failed to load presence:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  const sendPresenceUpdate = async (next: {
    status?: string;
    custom_status?: string | null;
    custom_status_emoji?: string | null;
  }) => {
    try {
      setLoading(true);
      await chatApi.updatePresence(next);
    } catch (err) {
      console.error("Failed to update presence:", err);
    } finally {
      setLoading(false);
    }
  };

  const chooseMode = async (nextMode: StatusMode) => {
    setMode(nextMode);
    await sendPresenceUpdate({ status: nextMode });
  };

  const updateText = async (val: string) => {
    setText(val);
    await sendPresenceUpdate({ custom_status: val || null });
  };

  const updateEmoji = async (e?: string) => {
    setEmoji(e);
    await sendPresenceUpdate({ custom_status_emoji: e || null });
  };

  const clearCustomStatus = async () => {
    setText("");
    setEmoji(undefined);
    await sendPresenceUpdate({
      custom_status: null,
      custom_status_emoji: null,
    });
  };

  const current = statusOption(mode);

  return (
    <Dropdown>
      <Dropdown.Trigger className="flex w-full items-center justify-between gap-1.5 px-1.5 py-1 font-normal text-left transition-colors hover:bg-[--surface-secondary]/50 outline-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: current.hex }}
          />
          <span className="min-w-0 flex-1 truncate text-[10px] text-[--muted]">
            {text ? `${emoji ?? ""} ${text}`.trim() : current.label}
          </span>
        </div>
        <ChevronDown size={12} className="shrink-0 text-[--muted]" />
      </Dropdown.Trigger>

      <Dropdown.Popover
        placement="bottom start"
        className="w-64 p-2 rounded-xl border border-[--surface-secondary] bg-[--surface] shadow-2xl"
      >
        <Dropdown.Menu onAction={(key) => chooseMode(key as StatusMode)}>
          <Dropdown.Section>
            {STATUS_OPTIONS.map((o) => (
              <Dropdown.Item
                key={o.mode}
                id={o.mode}
                textValue={o.label}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[--surface-secondary]"
              >
                <div className="flex w-full items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: o.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <Label className="block text-xs font-semibold text-[--foreground]">
                      {o.label}
                    </Label>
                    <span className="block text-[10px] text-[--muted] truncate">
                      {o.description}
                    </span>
                  </div>
                  {mode === o.mode && (
                    <Check size={13} className="text-[--accent] shrink-0" />
                  )}
                </div>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>

        <Separator className="my-2 border-t border-[--surface-secondary]" />

        <div className="px-1.5 pt-1 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[--muted]">
            Custom status
          </p>

          <div className="flex items-center gap-1.5 rounded-lg border border-[--surface-secondary] px-2 py-1 bg-transparent">
            <span className="text-sm">{emoji || "💬"}</span>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => updateText(text)}
              placeholder="What's happening?"
              maxLength={60}
              variant="secondary"
              fullWidth
              disabled={loading}
              className="border-none bg-transparent px-0 text-xs text-[--foreground] shadow-none focus-visible:ring-0 placeholder:text-[--muted]"
            />
            {(text || emoji) && (
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={clearCustomStatus}
                className="h-5 w-5 min-w-5 p-0 text-[--muted] hover:text-danger"
              >
                <X size={10} />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => updateEmoji(e)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-[--surface-secondary] ${
                  emoji === e
                    ? "bg-[--accent]/15 border border-[--accent]/30"
                    : ""
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </Dropdown.Popover>
    </Dropdown>
  );
}

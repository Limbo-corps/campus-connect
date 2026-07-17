// components/chat/MessageInput.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Paperclip, Send, Smile, Sticker, X } from "lucide-react";

import { userDisplayName } from "@/lib/chat/format";
import { BOT_COMMANDS } from "@/lib/chat/bot";
import type { LocalMessage, SendInput } from "@/hooks/useMessages";
import { EmojiPicker } from "./EmojiPicker";
import { StickerPicker } from "./StickerPicker";

interface MessageInputProps {
  onSend: (input: SendInput) => void | Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  replyTo?: LocalMessage | null;
  onCancelReply?: () => void;
  editing?: LocalMessage | null;
  onSaveEdit?: (content: string) => void | Promise<void>;
  onCancelEdit?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  editing,
  onSaveEdit,
  onCancelEdit,
  disabled,
  placeholder = "Type a message",
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "/" slash-command autocomplete hint (CampusBot).
  const slashQuery =
    !editing && value.startsWith("/") && !value.includes(" ")
      ? value.slice(1).toLowerCase()
      : null;
  const slashMatches =
    slashQuery !== null
      ? BOT_COMMANDS.filter((c) => c.name.startsWith(slashQuery)).slice(0, 6)
      : [];

  // When entering edit mode, prefill and focus.
  useEffect(() => {
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the editing prop into the composer
      setValue(editing.content);
      setAttachment(null);
      textareaRef.current?.focus();
    }
  }, [editing]);

  // Auto-grow the textarea.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  const emitTyping = (isTyping: boolean) => {
    if (editing) return; // don't broadcast typing while editing
    onTyping?.(isTyping);
  };

  const handleChange = (next: string) => {
    setValue(next);
    if (!onTyping) return;
    emitTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), 2000);
  };

  const reset = () => {
    setValue("");
    setAttachment(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setValue((v) => v + text);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    handleChange(next);
    // Restore caret just after the inserted text.
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const sendSticker = async (sticker: string) => {
    if (disabled || editing) return;
    setStickerOpen(false);
    await onSend({ content: sticker, replyTo: replyTo?.id ?? null });
  };

  const submit = async () => {
    if (disabled) return;
    const trimmed = value.trim();

    if (editing) {
      if (trimmed && trimmed !== editing.content) {
        await onSaveEdit?.(trimmed);
      } else {
        onCancelEdit?.();
      }
      reset();
      return;
    }

    if (!trimmed && !attachment) return;
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    emitTyping(false);

    await onSend({
      content: trimmed,
      attachment,
      replyTo: replyTo?.id ?? null,
    });
    reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
    if (e.key === "Escape") {
      if (editing) onCancelEdit?.();
      else if (replyTo) onCancelReply?.();
    }
  };

  return (
    <footer className="relative shrink-0 border-t border-[--surface-secondary] bg-transparent px-4 py-3">
      {/* Emoji / sticker popovers + click-away backdrop */}
      {(emojiOpen || stickerOpen) && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => {
              setEmojiOpen(false);
              setStickerOpen(false);
            }}
          />
          <div className="absolute bottom-full left-4 z-30 mb-2">
            {emojiOpen && (
              <EmojiPicker
                onPick={insertAtCursor}
                onClose={() => setEmojiOpen(false)}
              />
            )}
            {stickerOpen && (
              <StickerPicker
                onPick={sendSticker}
                onClose={() => setStickerOpen(false)}
              />
            )}
          </div>
        </>
      )}

      {/* CampusBot slash-command hint */}
      {slashMatches.length > 0 && (
        <div className="absolute bottom-full left-4 z-30 mb-2 w-72 overflow-hidden rounded-xl border border-[--surface-secondary] bg-[--surface] py-1 shadow-2xl">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[--muted]">
            CampusBot
          </p>
          {slashMatches.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                handleChange(`/${c.name} `);
                textareaRef.current?.focus();
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[--surface-secondary]"
            >
              <span className="font-mono text-xs font-semibold text-[--accent]">
                {c.usage}
              </span>
              <span className="truncate text-[10px] text-[--muted]">
                {c.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Reply / edit context banner */}
      {(replyTo || editing) && (
        <div className="mx-auto mb-2 flex w-full max-w-3xl items-center justify-between rounded-lg border-l-2 border-[--accent] bg-[--surface-secondary]/60 px-3 py-1.5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[--accent]">
              {editing ? "Editing message" : `Replying to ${userDisplayName(replyTo!.sender)}`}
            </p>
            <p className="truncate text-xs text-[--muted]">
              {(editing ?? replyTo)!.content || "Attachment"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (editing ? onCancelEdit?.() : onCancelReply?.())}
            aria-label="Cancel"
            className="ml-2 rounded-md p-1 text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Attachment preview */}
      {attachment && !editing && (
        <div className="mx-auto mb-2 flex w-full max-w-3xl items-center gap-2 rounded-lg bg-[--surface-secondary]/60 px-3 py-1.5 text-xs text-[--foreground]">
          <Paperclip size={13} className="text-[--accent]" />
          <span className="truncate">{attachment.name}</span>
          <button
            type="button"
            onClick={() => {
              setAttachment(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            aria-label="Remove attachment"
            className="ml-auto rounded-md p-0.5 text-[--muted] hover:text-danger"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-[--surface-secondary] bg-[--surface] px-3 py-2 shadow-sm focus-within:border-[--accent]/40"
      >
        {!editing && (
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach file"
              className="mb-1 shrink-0 text-[--muted] transition-colors hover:text-[--accent]"
            >
              <Paperclip size={19} />
            </button>
            <button
              type="button"
              onClick={() => {
                setStickerOpen((o) => !o);
                setEmojiOpen(false);
              }}
              aria-label="Stickers"
              className={`mb-1 shrink-0 transition-colors hover:text-[--accent] ${
                stickerOpen ? "text-[--accent]" : "text-[--muted]"
              }`}
            >
              <Sticker size={19} />
            </button>
            <button
              type="button"
              onClick={() => {
                setEmojiOpen((o) => !o);
                setStickerOpen(false);
              }}
              aria-label="Emoji"
              className={`mb-1 shrink-0 transition-colors hover:text-[--accent] ${
                emojiOpen ? "text-[--accent]" : "text-[--muted]"
              }`}
            >
              <Smile size={19} />
            </button>
          </>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="max-h-40 w-full resize-none bg-transparent py-1 text-sm leading-relaxed text-[--foreground] outline-none placeholder:text-[--muted]/65"
        />

        <button
          type="submit"
          disabled={disabled || (!value.trim() && !attachment)}
          aria-label={editing ? "Save edit" : "Send message"}
          className="mb-0.5 shrink-0 rounded-full bg-[--accent] p-2 text-[--accent-foreground] transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </footer>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Paperclip, Send, Smile, Sticker, X } from "lucide-react";
import { Button, Popover, TextArea, Tooltip } from "@heroui/react";

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
  disabled = false,
  placeholder = "Message...",
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [selectedCmdIndex, setSelectedCmdIndex] = useState(0);

  // Track previous edit target to handle prop transition during render without useEffect
  const [prevEditingId, setPrevEditingId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slash-command autocomplete logic (CampusBot)
  const slashQuery =
    !editing && value.startsWith("/") && !value.includes(" ")
      ? value.slice(1).toLowerCase()
      : null;

  const slashMatches =
    slashQuery !== null
      ? BOT_COMMANDS.filter((c) =>
          c.name.toLowerCase().startsWith(slashQuery),
        ).slice(0, 6)
      : [];

  // Adjust state synchronously during render when editing prop changes
  const currentEditingId = editing?.id ?? null;
  if (currentEditingId !== prevEditingId) {
    setPrevEditingId(currentEditingId);
    if (editing) {
      setValue(editing.content);
      setAttachment(null);
    }
  }

  // Focus textarea when entering edit or reply mode
  useEffect(() => {
    if (editing || replyTo) {
      textareaRef.current?.focus();
    }
  }, [editing, replyTo]);

  // Handle dynamic auto-growing textarea height
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const newHeight = Math.min(ta.scrollHeight, 200);
    ta.style.height = `${newHeight}px`;
  }, [value]);

  const emitTyping = (isTyping: boolean) => {
    if (editing) return;
    onTyping?.(isTyping);
  };

  const handleChange = (next: string) => {
    setValue(next);
    setSelectedCmdIndex(0);

    if (!onTyping) return;
    emitTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), 2000);
  };

  const reset = () => {
    setValue("");
    setAttachment(null);
    setSelectedCmdIndex(0);
    if (fileRef.current) fileRef.current.value = "";
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
    onCancelReply?.();
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

    // Clear reply state after sending
    if (replyTo) {
      onCancelReply?.();
    }

    reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashMatches.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCmdIndex((prev) => (prev + 1) % slashMatches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCmdIndex(
          (prev) => (prev - 1 + slashMatches.length) % slashMatches.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const activeIndex = selectedCmdIndex % slashMatches.length;
        const selectedCmd = slashMatches[activeIndex];
        if (selectedCmd) {
          handleChange(`/${selectedCmd.name} `);
          textareaRef.current?.focus();
        }
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
    if (e.key === "Escape") {
      if (editing) onCancelEdit?.();
      else if (replyTo) onCancelReply?.();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (editing) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1 || items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setAttachment(file);
          break;
        }
      }
    }
  };

  const activeCmdIndex =
    slashMatches.length > 0 ? selectedCmdIndex % slashMatches.length : 0;

  return (
    <footer className="relative w-full shrink-0 border-t border-[--surface-secondary] bg-[--surface] px-4 py-3">
      {/* Slash command hints dropdown */}
      {slashMatches.length > 0 && (
        <div className="absolute bottom-full left-4 z-30 mb-2 w-72 overflow-hidden rounded-xl border border-[--surface-secondary] bg-[--surface] py-1 shadow-2xl">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[--muted]">
            CampusBot
          </p>
          {slashMatches.map((c, index) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                handleChange(`/${c.name} `);
                textareaRef.current?.focus();
              }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors ${
                index === activeCmdIndex
                  ? "bg-[--surface-secondary]"
                  : "hover:bg-[--surface-secondary]"
              }`}
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

      {/* Reply or Edit Context Banner */}
      {(replyTo || editing) && (
        <div className="mb-2 flex w-full items-center justify-between rounded-lg border-l-2 border-[--accent] bg-[--surface-secondary]/60 px-3 py-1.5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[--accent]">
              {editing
                ? "Editing message"
                : `Replying to ${userDisplayName(replyTo!.sender)}`}
            </p>
            <p className="truncate text-xs text-[--muted]">
              {(editing ?? replyTo)!.content || "Attachment"}
            </p>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={() => (editing ? onCancelEdit?.() : onCancelReply?.())}
            aria-label="Cancel context"
            className="text-[--muted] hover:text-[--foreground]"
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Attachment Preview */}
      {attachment && !editing && (
        <div className="mb-2 flex w-full items-center gap-2 rounded-lg bg-[--surface-secondary]/60 px-3 py-1.5 text-xs text-[--foreground]">
          <Paperclip size={13} className="text-[--accent]" />
          <span className="truncate">{attachment.name}</span>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={() => {
              setAttachment(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            aria-label="Remove attachment"
            className="ml-auto text-[--muted] hover:text-danger"
          >
            <X size={13} />
          </Button>
        </div>
      )}

      {/* Input Shell */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex w-full flex-col rounded-2xl border border-[--surface-secondary] bg-[--surface-secondary]/30 p-2 shadow-sm focus-within:border-[--accent]/50 focus-within:bg-[--surface]"
      >
        {/* HeroUI v3 TextArea */}
        <TextArea
          ref={textareaRef}
          value={value}
          rows={1}
          disabled={disabled}
          variant="secondary"
          fullWidth
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="max-h-50 min-h-9 w-full resize-none border-none bg-transparent px-2.5 py-1 text-sm leading-relaxed shadow-none focus:outline-none focus:ring-0"
        />

        {/* Action Row */}
        <div className="mt-1 flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-1">
            {!editing && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                />

                <Tooltip>
                  <Tooltip.Trigger>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={() => fileRef.current?.click()}
                      aria-label="Attach file"
                      className="text-[--muted] hover:text-[--accent]"
                    >
                      <Paperclip size={18} />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Attach File</Tooltip.Content>
                </Tooltip>

                <Popover
                  isOpen={stickerOpen}
                  onOpenChange={(open) => {
                    setStickerOpen(open);
                    if (open) setEmojiOpen(false);
                  }}
                >
                  <Popover.Trigger>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="Stickers"
                      className={`hover:text-[--accent] ${
                        stickerOpen ? "text-[--accent]" : "text-[--muted]"
                      }`}
                    >
                      <Sticker size={18} />
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content className="border-none p-0 shadow-2xl">
                    <Popover.Dialog>
                      <StickerPicker
                        onPick={sendSticker}
                        onClose={() => setStickerOpen(false)}
                      />
                    </Popover.Dialog>
                  </Popover.Content>
                </Popover>

                <Popover
                  isOpen={emojiOpen}
                  onOpenChange={(open) => {
                    setEmojiOpen(open);
                    if (open) setStickerOpen(false);
                  }}
                >
                  <Popover.Trigger>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="Emoji"
                      className={`hover:text-[--accent] ${
                        emojiOpen ? "text-[--accent]" : "text-[--muted]"
                      }`}
                    >
                      <Smile size={18} />
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content className="border-none p-0 shadow-2xl">
                    <Popover.Dialog>
                      <EmojiPicker
                        onPick={insertAtCursor}
                        onClose={() => setEmojiOpen(false)}
                      />
                    </Popover.Dialog>
                  </Popover.Content>
                </Popover>
              </>
            )}
          </div>

          <Button
            isIconOnly
            type="submit"
            size="sm"
            isDisabled={disabled || (!value.trim() && !attachment)}
            aria-label={editing ? "Save edit" : "Send message"}
            className="rounded-full bg-[--accent] text-[--accent-foreground] transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={15} />
          </Button>
        </div>
      </form>
    </footer>
  );
}

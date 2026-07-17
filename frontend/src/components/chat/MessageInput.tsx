// components/chat/MessageInput.tsx
"use client";

import React, { useRef, useEffect } from "react";
import { PlusCircle, Smile, Send } from "lucide-react";

interface MessageInputProps {
  value: string;
  placeholderName: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
}

export function MessageInput({
  value,
  placeholderName,
  onChange,
  onSubmit,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Automatically scales the input box up to a max capped height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <footer className="shrink-0 px-4 pb-6 bg-transparent">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mx-auto flex w-full max-w-5xl items-end rounded-xl bg-white/10 dark:bg-black/10 border border-border/15 px-4 py-2.5 backdrop-blur-md shadow-sm focus-within:border-[--accent]/40 focus-within:bg-white/15 dark:focus-within:bg-black/15 transition-all"
      >
        <button
          type="button"
          className="mb-1 mr-3 text-[--muted] hover:text-[--foreground] transition-colors shrink-0"
          aria-label="Add attachment"
        >
          <PlusCircle size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Message @${placeholderName}`}
          rows={1}
          onKeyDown={handleKeyDown}
          className="w-full max-h-40 resize-none bg-transparent text-sm text-[--foreground] outline-none placeholder:text-[--muted]/65 py-1 leading-relaxed"
        />

        <div className="ml-3 flex items-center gap-3 text-[--muted] mb-1 shrink-0">
          <button
            type="button"
            className="hover:text-[--foreground] transition-colors"
            aria-label="Add emoji"
          >
            <Smile size={18} />
          </button>
          {value.trim() && (
            <button
              type="submit"
              className="text-[--accent] hover:opacity-85 transition-opacity active:scale-95 transform duration-70"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </form>
    </footer>
  );
}

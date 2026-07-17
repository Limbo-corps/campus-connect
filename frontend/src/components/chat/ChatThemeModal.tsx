"use client";

import React, { useEffect, useRef, useState } from "react";
import { Modal, Button } from "@heroui/react";
import { Check, ImagePlus, Palette, Trash2, X } from "lucide-react";

import {
  DEFAULT_THEME,
  THEME_PRESETS,
  getTheme,
  setTheme,
  themeLayerStyles,
  type ChatTheme,
} from "@/lib/chat/themes";

interface ChatThemeModalProps {
  conversationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Downscale an uploaded image to a data URL small enough for localStorage. */
function fileToScaledDataUrl(file: File, maxSize = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatThemeModal({
  conversationId,
  isOpen,
  onOpenChange,
}: ChatThemeModalProps) {
  const [draft, setDraft] = useState<ChatTheme>(DEFAULT_THEME);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load current theme whenever the modal opens.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync draft from persisted theme when opening
    if (isOpen) setDraft(getTheme(conversationId));
  }, [isOpen, conversationId]);

  // Apply live so the change previews behind the modal.
  const apply = (next: ChatTheme) => {
    setDraft(next);
    setTheme(conversationId, next);
  };

  const choosePreset = (id: string) => {
    apply({ id, image: null });
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const image = await fileToScaledDataUrl(file);
      apply({
        id: "custom",
        image,
        brightness: draft.brightness ?? 1,
        blur: draft.blur ?? 0,
        dim: draft.dim ?? 0.35,
      });
    } catch {
      /* ignore bad images */
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const reset = () => apply(DEFAULT_THEME);

  const preview = themeLayerStyles(draft);
  const hasImage = !!draft.image;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog className="w-full max-w-sm rounded-2xl border border-[--surface-secondary] bg-[--surface] text-[--foreground] shadow-2xl">
            <Modal.CloseTrigger className="absolute right-4 top-4 rounded-full p-1 text-[--muted] hover:bg-[--surface-secondary] hover:text-[--foreground]">
              <X size={16} />
            </Modal.CloseTrigger>

            <Modal.Header className="pb-2">
              <Modal.Heading className="flex items-center gap-2 text-lg font-bold">
                <Palette size={18} className="text-[--accent]" />
                Chat theme
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="space-y-4 px-5 py-2">
              {/* Live preview */}
              <div className="relative h-24 overflow-hidden rounded-xl border border-[--surface-secondary]">
                <div
                  className="absolute inset-0 bg-[--surface]"
                  style={preview.base}
                />
                <div className="absolute inset-0" style={preview.scrim} />
                <div className="absolute inset-0 flex items-end gap-2 p-2">
                  <span className="rounded-2xl bg-[--surface-secondary] px-3 py-1.5 text-xs shadow">
                    Hey! 👋
                  </span>
                  <span className="ml-auto rounded-2xl bg-[--accent] px-3 py-1.5 text-xs text-[--accent-foreground] shadow">
                    Looks great 🔥
                  </span>
                </div>
              </div>

              {/* Presets */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[--muted]">
                  Presets
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {THEME_PRESETS.map((p) => {
                    const selected = !hasImage && draft.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => choosePreset(p.id)}
                        title={p.label}
                        className={`relative h-12 overflow-hidden rounded-lg border transition-all ${
                          selected
                            ? "border-[--accent] ring-2 ring-[--accent]/40"
                            : "border-[--surface-secondary] hover:border-[--accent]/50"
                        }`}
                        style={{ background: p.swatch }}
                      >
                        {selected && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check
                              size={16}
                              className="text-white drop-shadow"
                              strokeWidth={3}
                            />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom image */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[--muted]">
                  Custom image
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => fileRef.current?.click()}
                  isPending={uploading}
                  className="w-full gap-2 rounded-xl border-[--surface-secondary] text-xs font-semibold"
                >
                  <ImagePlus size={14} />
                  {hasImage ? "Replace image" : "Upload background"}
                </Button>

                {hasImage && (
                  <div className="mt-3 space-y-3">
                    <Slider
                      label="Brightness"
                      min={0.2}
                      max={1.6}
                      step={0.05}
                      value={draft.brightness ?? 1}
                      onChange={(v) => apply({ ...draft, brightness: v })}
                    />
                    <Slider
                      label="Blur"
                      min={0}
                      max={20}
                      step={1}
                      value={draft.blur ?? 0}
                      onChange={(v) => apply({ ...draft, blur: v })}
                    />
                    <Slider
                      label="Dim"
                      min={0}
                      max={0.85}
                      step={0.05}
                      value={draft.dim ?? 0.35}
                      onChange={(v) => apply({ ...draft, dim: v })}
                    />
                  </div>
                )}
              </div>
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-between border-t border-[--surface-secondary] px-5 pb-4 pt-3">
              <Button
                size="sm"
                variant="ghost"
                onPress={reset}
                className="gap-1.5 rounded-xl text-xs font-semibold text-[--muted]"
              >
                <Trash2 size={13} />
                Reset
              </Button>
              <Button
                slot="close"
                size="sm"
                className="rounded-xl bg-[--accent] text-xs font-bold text-[--accent-foreground]"
              >
                Done
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[--foreground]">
        {label}
        <span className="text-[--muted]">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[--surface-secondary] accent-[--accent]"
      />
    </label>
  );
}

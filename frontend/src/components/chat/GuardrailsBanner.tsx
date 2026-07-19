"use client";

import { Card } from "@heroui/react";
import { ShieldAlert } from "lucide-react";

export function GuardrailsBanner() {
  return (
    <Card className="flex flex-row items-start gap-3 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3.5 shadow-none">
      <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
      <div className="min-w-0">
        <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
          Stay safe
        </h4>
        <p className="mt-1 text-[10px] leading-normal text-[--muted]">
          Be respectful and follow campus community guidelines. Never share
          passwords or personal financial details.
        </p>
      </div>
    </Card>
  );
}

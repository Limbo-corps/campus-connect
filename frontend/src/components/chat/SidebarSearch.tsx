// components/chat/SidebarSearch.tsx
import React from "react";
import { Search } from "lucide-react";

interface SidebarSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export function SidebarSearch({ value, onChange }: SidebarSearchProps) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/15 px-3 bg-transparent">
      <div className="relative flex w-full items-center">
        <span className="absolute left-2.5 text-[--foreground]/50">
          <Search size={12} />
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Find a conversation..."
          className="w-full rounded-md bg-foreground/5 pl-8 pr-2 py-1 text-xs text-[--foreground] outline-none placeholder:text-[--foreground]/40 border border-transparent focus:border-[--accent]/30 focus:bg-foreground/10 transition-colors"
        />
      </div>
    </div>
  );
}

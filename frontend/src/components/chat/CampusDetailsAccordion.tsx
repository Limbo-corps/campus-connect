"use client";

import { Accordion } from "@heroui/react";
import { School, MapPin, Users } from "lucide-react";
import CampusEmblem from "@/components/campus/CampusEmblem";
import { campusImage } from "@/lib/banners";

import type { Campus } from "@/types";

export function CampusDetailsAccordion({
  activeCampus,
}: {
  activeCampus: Campus | null;
}) {
  if (!activeCampus) return null;

  return (
    <Accordion.Item id="campus">
      <Accordion.Heading>
        <Accordion.Trigger className="rounded-lg border border-[--surface-secondary] bg-[--surface] px-3 py-2 text-xs font-bold text-[--foreground]">
          <span className="flex items-center gap-2">
            <School size={16} className="text-[--muted]" />
            Active Campus
          </span>
          <Accordion.Indicator />
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body>
          <div className="space-y-3 pb-3 text-left">
            <div
              className="h-14 rounded-lg border border-[--surface-secondary] bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url('${activeCampus.banner_url || campusImage(activeCampus.name)}')`,
              }}
            />

            <div className="flex items-center gap-2.5">
              <CampusEmblem
                campus={activeCampus}
                className="size-9 shrink-0 rounded-md border border-[--surface-secondary] shadow-sm"
                textClassName="text-xs"
              />
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold text-[--foreground]">
                  {activeCampus.name}
                </span>
                {(activeCampus.city || activeCampus.state) && (
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[--muted]">
                    <MapPin size={10} />
                    {[activeCampus.city, activeCampus.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>

            {activeCampus.description && (
              <p className="line-clamp-3 border-t border-[--surface-secondary]/50 pt-2 text-xs leading-relaxed text-[--foreground]">
                {activeCampus.description}
              </p>
            )}

            <div className="flex items-center gap-1.5 rounded-md bg-[--surface-secondary]/50 p-2 text-[10px] text-[--muted]">
              <Users size={12} className="text-[--accent]" />
              <span>
                <strong>
                  {activeCampus.students_count?.toLocaleString() ?? 0}
                </strong>{" "}
                registered students here
              </span>
            </div>
          </div>
        </Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

"use client";

import { useState } from "react";
import { Accordion, Switch } from "@heroui/react";
import { Bell } from "lucide-react";

export function ControlPreferencesAccordion({ isGroup }: { isGroup: boolean }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  return (
    <Accordion.Item id="preferences">
      <Accordion.Heading>
        <Accordion.Trigger className="rounded-lg border border-[--surface-secondary] bg-[--surface] px-3 py-2 text-xs font-bold text-[--foreground]">
          <span className="flex items-center gap-2">
            <Bell size={16} className="text-[--muted]" />
            Chat Controls
          </span>
          <Accordion.Indicator />
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body>
          <div className="space-y-3 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-[--foreground]">
                  Mute Notifications
                </span>
                <span className="text-[10px] text-[--muted]">
                  Silence highlights and alerts
                </span>
              </div>
              <Switch size="sm" isSelected={isMuted} onChange={setIsMuted}>
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
            </div>

            {!isGroup && (
              <div className="flex items-center justify-between gap-2 border-t border-[--surface-secondary]/50 pt-3">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-danger">
                    Block User
                  </span>
                  <span className="text-[10px] text-[--muted]">
                    Prevent direct communication
                  </span>
                </div>
                <Switch
                  size="sm"
                  isSelected={isBlocked}
                  onChange={setIsBlocked}
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </div>
            )}
          </div>
        </Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

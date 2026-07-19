"use client";

import { Accordion } from "@heroui/react";
import type { Conversation, Campus, ChatUser } from "@/types";
import { ProfileOverviewCard } from "./ProfileOverviewCard";
import { CampusDetailsAccordion } from "./CampusDetailsAccordion";
import { ControlPreferencesAccordion } from "./ControlPreferencesAccordion";
import { UserOrMembersAccordion } from "./UserOrMembersAccordion";
import { GuardrailsBanner } from "./GuardrailsBanner";

interface ChatRightRailProps {
  conversation: Conversation;
  other: ChatUser | null;
  meId: string | null;
  activeCampus: Campus | null;
  otherIsOnline: boolean;
  checkUserOnlineStatus: (id?: string) => boolean;
}

export function ChatRightRail({
  conversation,
  other,
  meId,
  activeCampus,
  otherIsOnline,
  checkUserOnlineStatus,
}: ChatRightRailProps) {
  return (
    <aside className="col-span-3 hidden h-full flex-col overflow-y-auto pr-1 [scrollbar-width:thin] xl:flex">
      <div className="space-y-3">
        <ProfileOverviewCard
          conversation={conversation}
          other={other}
          otherIsOnline={otherIsOnline}
        />

        <Accordion variant="default" hideSeparator className="px-0">
          <UserOrMembersAccordion
            conversation={conversation}
            other={other}
            meId={meId}
            checkUserOnlineStatus={checkUserOnlineStatus}
          />

          <CampusDetailsAccordion activeCampus={activeCampus} />

          <ControlPreferencesAccordion isGroup={conversation.is_group} />
        </Accordion>

        <GuardrailsBanner />
      </div>
    </aside>
  );
}

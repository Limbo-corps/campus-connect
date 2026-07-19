"use client";

import { useCallback, useEffect, useRef } from "react";
import { Card, Spinner } from "@heroui/react";
import type { Conversation, User, ChatUser } from "@/types";
import type { LocalMessage, SendInput } from "@/hooks/useMessages";
import { ThreadHeader } from "@/components/chat/ThreadHeader";
import { MessageItem } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";
import {
  formatDayDivider,
  shouldGroup,
  userDisplayName,
} from "@/lib/chat/format";

interface ChatThreadCentralProps {
  conversation: Conversation;
  meId: string | null;
  user: User | null;
  isOnline: (userId: string | null | undefined) => boolean;
  typingText: string | null;
  loading: boolean;
  loadingOlder: boolean;
  hasMore: boolean;
  allMessages: LocalMessage[];
  replyTo: LocalMessage | null;
  editing: LocalMessage | null;
  other: ChatUser | null;
  loadOlder: () => Promise<void>;
  setReplyTo: (msg: LocalMessage | null) => void;
  setEditing: (msg: LocalMessage | null) => void;
  handleRename: () => Promise<void>;
  handleLeave: () => Promise<void>;
  handleDeleteConversation: () => Promise<void>;
  handleDelete: (msg: LocalMessage) => Promise<void>;
  handleReact: (msg: LocalMessage, emoji: string) => void;
  handleSend: (input: SendInput) => Promise<void>;
  handleTyping: (isTyping: boolean) => void;
  edit: (id: string, content: string) => Promise<void>;
  setAddPeopleOpen: (open: boolean) => void;
}

export function ChatThreadCentral({ // props typed loosely to reduce transient lint noise

  conversation,
  meId,
  user,
  isOnline,
  typingText,
  loading,
  loadingOlder,
  hasMore,
  allMessages,
  replyTo,
  editing,
  other,
  loadOlder,
  setReplyTo,
  setEditing,
  handleRename,
  handleLeave,
  handleDeleteConversation,
  handleDelete,
  handleReact,
  handleSend,
  handleTyping,
  edit,
  setAddPeopleOpen,
}: ChatThreadCentralProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);

  useEffect(() => {
    if (loading) return;

    const grew = allMessages.length > prevLenRef.current;
    const last = allMessages[allMessages.length - 1];
    const isMine = last?.sender.id === meId;
    const el = scrollRef.current;

    const nearBottom = el
      ? el.scrollHeight - el.scrollTop - el.clientHeight < 200
      : true;

    if (grew && (isMine || nearBottom || prevLenRef.current === 0)) {
      endRef.current?.scrollIntoView({
        behavior: prevLenRef.current === 0 ? "auto" : "smooth",
      });
    }
    prevLenRef.current = allMessages.length;
  }, [allMessages, loading, meId]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el && el.scrollTop < 60 && hasMore && !loadingOlder) {
      const prevHeight = el.scrollHeight;
      void loadOlder().then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop =
              scrollRef.current.scrollHeight - prevHeight;
          }
        });
      });
    }
  }, [hasMore, loadingOlder, loadOlder]);

  return (
    <main className="col-span-9 flex h-full flex-col overflow-hidden xl:col-span-6">
      <Card className="flex flex-1 flex-col overflow-hidden border border-[--surface-secondary] bg-[--surface] shadow-sm">
        <ThreadHeader
          conversation={conversation}
          meId={meId}
          isOnline={isOnline}
          typingText={typingText}
          onRename={handleRename}
          onAddPeople={() => setAddPeopleOpen(true)}
          onLeave={handleLeave}
          onDelete={handleDeleteConversation}
        />

        <div className="relative flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="absolute inset-0 overflow-y-auto px-4 py-4 [scrollbar-width:thin]"
          >
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : allMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-[--muted]">
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs">Say hi to start the conversation.</p>
              </div>
            ) : (
              <>
                {loadingOlder && (
                  <div className="flex justify-center py-2">
                    <Spinner size="sm" />
                  </div>
                )}
                {allMessages.map((message, i) => {
                  const prev = allMessages[i - 1];
                  const isMe = message.sender.id === meId;
                  const grouped = shouldGroup(prev, message);
                  const showDivider =
                    !prev ||
                    new Date(prev.created_at).toDateString() !==
                      new Date(message.created_at).toDateString();

                  return (
                    <div key={message.id}>
                      {showDivider && (
                        <div className="my-3 flex items-center justify-center">
                          <span className="rounded-full bg-[--surface-secondary] px-3 py-0.5 text-[10px] font-medium text-[--muted]">
                            {formatDayDivider(message.created_at)}
                          </span>
                        </div>
                      )}
                      <MessageItem
                        message={message}
                        isMe={isMe}
                        isGroup={conversation.is_group}
                        showHeader={!grouped || showDivider}
                        meId={user?.id}
                        // Provide participants' read state so MessageItem can compute
                        // whether a message has been seen by other participants.
                        participantsDetail={conversation.participants_detail}
                        onReply={setReplyTo}
                        onEdit={setEditing}
                        onDelete={handleDelete}
                        onReact={handleReact}
                      />
                    </div>
                  );
                })}
                <div ref={endRef} />
              </>
            )}
          </div>
        </div>

        <MessageInput
          onSend={handleSend}
          onTyping={handleTyping}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editing={editing}
          onSaveEdit={async (content) => {
            if (editing) await edit(editing.id, content);
            setEditing(null);
          }}
          onCancelEdit={() => setEditing(null)}
          placeholder={
            conversation.is_group
              ? `Message ${conversation.display_name}`
              : `Message ${userDisplayName(other)}`
          }
        />
      </Card>
    </main>
  );
}

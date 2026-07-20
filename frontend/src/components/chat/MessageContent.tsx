"use client";

import React from "react";
import Image from "next/image";
import { FileIcon } from "lucide-react";
import type { LocalMessage } from "@/hooks/useMessages";

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

interface MessageContentProps {
  message: LocalMessage;
  deleted: boolean;
  jumbo: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  message,
  deleted,
  jumbo,
}) => {
  const renderMessageContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(URL_REGEX);
    if (parts.length === 1) return content;

    return parts.map((part, index) => {
      if (part.match(URL_REGEX)) {
        const href = part.toLowerCase().startsWith("http")
          ? part
          : `https://${part}`;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[--accent] underline underline-offset-2 hover:opacity-80 break-all font-medium transition-opacity duration-150"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (deleted) {
    return (
      <span className="italic text-[--muted] text-xs">
        This message was deleted.
      </span>
    );
  }

  return (
    <>
      {message.type === "IMAGE" && message.attachment_url && (
        <div className="mt-1 mb-1 max-w-md overflow-hidden rounded-xl border border-white/10 shadow-sm">
          <Image
            src={message.attachment_url}
            alt="Attachment"
            width={480}
            height={320}
            className="w-full h-auto max-h-80 object-cover rounded-xl transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      )}

      {message.type !== "IMAGE" &&
        message.type !== "TEXT" &&
        message.attachment_url && (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="my-1 inline-flex items-center gap-2.5 bg-[--surface-secondary]/60 px-3 py-2 text-xs font-medium hover:bg-[--surface-secondary] transition-all border border-white/5 rounded-xl max-w-sm group/file"
          >
            <div className="p-1.5 rounded-lg bg-[--accent]/10 text-[--accent] group-hover/file:scale-110 transition-transform">
              <FileIcon size={14} />
            </div>
            <span className="truncate">Open attachment</span>
          </a>
        )}

      {message.content && (
        <div
          className={
            jumbo
              ? "text-3xl py-1 select-none"
              : "whitespace-pre-wrap wrap-break-word font-normal"
          }
        >
          {jumbo ? message.content : renderMessageContent(message.content)}
        </div>
      )}
    </>
  );
};

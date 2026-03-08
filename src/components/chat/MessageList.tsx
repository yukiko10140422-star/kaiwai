"use client";

import { useEffect, useRef } from "react";
import MessageItem, { type MessageWithAuthor } from "./MessageItem";
interface ReadStatusEntry {
  user_id: string;
  last_read_at: string;
}

interface MessageListProps {
  messages: MessageWithAuthor[];
  currentUserId: string;
  onThreadClick?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onPinMessage?: (messageId: string, pinned: boolean) => void;
  readStatuses?: ReadStatusEntry[];
  userRoles?: Record<string, string[]>;
}

function isSameMinute(a: string, b: string): boolean {
  return a.slice(0, 16) === b.slice(0, 16);
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MessageList({ messages, currentUserId, onThreadClick, onDeleteMessage, onEditMessage, onPinMessage, readStatuses, userRoles }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-sm">
        No messages yet. Start the conversation!
      </div>
    );
  }

  let lastDate = "";

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {messages.map((msg, i) => {
        const msgDate = new Date(msg.created_at).toDateString();
        const showDateSeparator = msgDate !== lastDate;
        lastDate = msgDate;

        const prev = messages[i - 1];
        const isGrouped =
          !showDateSeparator &&
          !!prev &&
          prev.user_id === msg.user_id &&
          isSameMinute(prev.created_at, msg.created_at);

        return (
          <div key={msg.id}>
            {showDateSeparator && (
              <div className="flex items-center gap-4 px-3 sm:px-6 py-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-medium text-muted">
                  {formatDateSeparator(msg.created_at)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            <MessageItem
              message={msg}
              currentUserId={currentUserId}
              isGrouped={isGrouped}
              onThreadClick={onThreadClick}
              onDelete={onDeleteMessage}
              onEdit={onEditMessage}
              onPin={onPinMessage}
              roles={userRoles?.[msg.user_id]}
              readCount={
                msg.user_id === currentUserId && readStatuses
                  ? readStatuses.filter(
                      (rs) =>
                        rs.user_id !== currentUserId &&
                        rs.last_read_at >= msg.created_at
                    ).length
                  : undefined
              }
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

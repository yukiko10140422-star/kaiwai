"use client";

import { useState, useEffect } from "react";
import { getPinnedMessages } from "@/lib/chat";
import type { MessageWithAuthor } from "./MessageItem";

interface PinnedMessagesProps {
  channelId: string;
  open: boolean;
  onClose: () => void;
  onUnpin?: (messageId: string) => void;
  /** Increment this to force a refresh */
  refreshKey?: number;
}

export default function PinnedMessages({ channelId, open, onClose, onUnpin, refreshKey }: PinnedMessagesProps) {
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getPinnedMessages(channelId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [channelId, open, refreshKey]);

  if (!open) return null;

  return (
    <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto bg-sidebar border border-border rounded-xl shadow-xl z-30 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold">ピン留めメッセージ</h3>
        <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-muted text-center py-4">読み込み中...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">ピン留めされたメッセージはありません</p>
      ) : (
        <div className="flex flex-col gap-2">
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-lg border border-border p-2.5 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{msg.author.display_name}</span>
                {onUnpin && (
                  <button
                    onClick={() => onUnpin(msg.id)}
                    className="text-[10px] text-muted hover:text-foreground transition-colors"
                  >
                    解除
                  </button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap break-words line-clamp-3">{msg.content}</p>
              <span className="text-[10px] text-muted mt-1 block">
                {new Date(msg.created_at).toLocaleDateString("ja-JP")}{" "}
                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

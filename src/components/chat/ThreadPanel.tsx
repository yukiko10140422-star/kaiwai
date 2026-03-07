"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import type { MessageWithAuthor } from "./MessageItem";
import type { Message, Profile, MessageAttachment } from "@/types/database";
import { getThreadReplies, sendThreadReply } from "@/lib/chat";
import { createClient } from "@/lib/supabase/client";

interface ThreadPanelProps {
  parentMessage: MessageWithAuthor;
  channelId: string;
  currentUserId: string;
  onClose: () => void;
}

export default function ThreadPanel({
  parentMessage,
  channelId,
  currentUserId,
  onClose,
}: ThreadPanelProps) {
  const [replies, setReplies] = useState<MessageWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  // Load replies
  useEffect(() => {
    setLoading(true);
    getThreadReplies(parentMessage.id)
      .then(setReplies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [parentMessage.id]);

  // Realtime: listen for new replies to this thread
  useEffect(() => {
    const supabase = createClient();
    const subscription = supabase
      .channel(`thread:${parentMessage.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `parent_id=eq.${parentMessage.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Fetch full message with author
          const { data } = await supabase
            .from("messages")
            .select("*, profiles(*), message_attachments(*)")
            .eq("id", newMsg.id)
            .single();

          if (data) {
            const fullMsg: MessageWithAuthor = {
              ...(data as unknown as Message),
              author: (data as Record<string, unknown>).profiles as Profile,
              attachments: ((data as Record<string, unknown>).message_attachments as MessageAttachment[]) ?? [],
            };

            setReplies((prev) => {
              if (prev.some((m) => m.id === fullMsg.id)) return prev;
              return [...prev, fullMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [parentMessage.id]);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        await sendThreadReply(channelId, parentMessage.id, content);
      } catch (e) {
        console.error("Failed to send thread reply:", e);
      }
    },
    [channelId, parentMessage.id]
  );

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-40 md:relative md:inset-auto md:z-auto w-full md:w-[360px] h-full border-l border-border bg-sidebar flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="font-semibold text-sm">スレッド</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-card transition-colors text-muted hover:text-foreground"
          aria-label="スレッドを閉じる"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Parent message */}
      <div className="border-b border-border py-2">
        <MessageItem
          message={parentMessage}
          currentUserId={currentUserId}
        />
      </div>

      {/* Reply count */}
      <div className="px-4 py-2 text-xs text-muted border-b border-border">
        {replies.length} 件の返信
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted text-sm">
            読み込み中…
          </div>
        ) : replies.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted text-sm">
            まだ返信はありません
          </div>
        ) : (
          replies.map((reply) => (
            <MessageItem
              key={reply.id}
              message={reply}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      {/* Reply input */}
      <MessageInput
        onSend={(content) => handleSend(content)}
        placeholder="返信を入力..."
      />
    </motion.div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { parseMessageSegments } from "@/lib/mentions";
import type { Message, MessageAttachment, MessageReaction, Profile } from "@/types/database";
import { toggleReaction, groupReactions } from "@/lib/reactions";
import ReactionBar from "./ReactionBar";
import ReactionPicker from "./ReactionPicker";

export interface MessageWithAuthor extends Message {
  author: Profile;
  attachments?: MessageAttachment[];
  reply_count?: number;
  reactions?: MessageReaction[];
}

interface MessageItemProps {
  message: MessageWithAuthor;
  currentUserId: string;
  isGrouped?: boolean;
  onThreadClick?: (messageId: string) => void;
  memberNames?: string[];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function useSignedUrl(storagePath: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.storage
      .from("attachments")
      .createSignedUrl(storagePath, 3600) // 1時間有効
      .then(({ data }) => {
        if (data?.signedUrl) setUrl(data.signedUrl);
      });
  }, [storagePath]);

  return url;
}

function AttachmentPreview({ attachment }: { attachment: MessageAttachment }) {
  const url = useSignedUrl(attachment.storage_path);
  const isImage = attachment.file_type.startsWith("image/");
  const isVideo = attachment.file_type.startsWith("video/");

  if (!url) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 mt-1 text-xs text-muted">
        読み込み中…
      </div>
    );
  }

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img
          src={url}
          alt={attachment.file_name}
          className="max-w-xs rounded-lg border border-border mt-1 cursor-pointer hover:opacity-90 transition-opacity"
        />
      </a>
    );
  }

  if (isVideo) {
    return (
      <video
        src={url}
        controls
        className="max-w-xs rounded-lg border border-border mt-1"
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 mt-1 text-sm hover:bg-card transition-colors"
    >
      <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
      <span className="truncate max-w-[200px]">{attachment.file_name}</span>
      <span className="text-xs text-muted">
        {formatFileSize(attachment.file_size)}
      </span>
    </a>
  );
}

export default function MessageItem({ message, currentUserId, isGrouped = false, onThreadClick, memberNames = [] }: MessageItemProps) {
  const [reactions, setReactions] = useState<MessageReaction[]>(message.reactions ?? []);
  const [showPicker, setShowPicker] = useState(false);

  const contentSegments = useMemo(
    () => parseMessageSegments(message.content, memberNames),
    [message.content, memberNames]
  );

  // 親から reactions が更新された場合に同期
  useEffect(() => {
    if (message.reactions) setReactions(message.reactions);
  }, [message.reactions]);

  const grouped = groupReactions(reactions, currentUserId);

  const handleToggle = useCallback(
    async (emoji: string) => {
      // 楽観的更新
      const existing = reactions.find(
        (r) => r.user_id === currentUserId && r.emoji === emoji
      );
      if (existing) {
        setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      } else {
        const optimistic: MessageReaction = {
          id: `temp-${Date.now()}`,
          message_id: message.id,
          user_id: currentUserId,
          emoji,
          created_at: new Date().toISOString(),
        };
        setReactions((prev) => [...prev, optimistic]);
      }

      try {
        await toggleReaction(message.id, currentUserId, emoji);
      } catch {
        // リバート: サーバーから再取得する代わりに元に戻す
        if (existing) {
          setReactions((prev) => [...prev, existing]);
        } else {
          setReactions((prev) =>
            prev.filter(
              (r) => !(r.user_id === currentUserId && r.emoji === emoji && r.id.startsWith("temp-"))
            )
          );
        }
      }
    },
    [reactions, currentUserId, message.id]
  );

  return (
    <motion.div
      className="group relative flex gap-3 px-6 py-0.5 hover:bg-card/50 transition-colors"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Avatar or time gutter */}
      <div className="w-10 shrink-0 flex items-start pt-1">
        {isGrouped ? (
          <span className="hidden group-hover:block text-[10px] text-muted leading-6">
            {formatTime(message.created_at)}
          </span>
        ) : (
          <Avatar src={message.author.avatar_url} name={message.author.display_name} size="sm" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {!isGrouped && (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm">{message.author.display_name}</span>
            <span className="text-[10px] text-muted">{formatTime(message.created_at)}</span>
            {message.is_edited && (
              <span className="text-[10px] text-muted">(edited)</span>
            )}
          </div>
        )}

        <p className="text-sm whitespace-pre-wrap break-words">
          {contentSegments.map((seg, i) =>
            seg.type === "mention" ? (
              <span key={i} className="font-semibold text-accent bg-accent/10 rounded px-0.5">
                {seg.value}
              </span>
            ) : (
              <span key={i}>{seg.value}</span>
            )
          )}
        </p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {message.attachments.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {/* Reactions */}
        <ReactionBar reactions={grouped} onToggle={handleToggle} />

        {/* Thread indicator */}
        {message.reply_count != null && message.reply_count > 0 && (
          <button
            onClick={() => onThreadClick?.(message.id)}
            className="mt-1 text-xs text-accent hover:underline"
          >
            {message.reply_count} replies
          </button>
        )}
      </div>

      {/* Hover action: add reaction */}
      <div className="absolute right-4 top-0 hidden group-hover:flex items-center">
        <div className="relative">
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="p-1 rounded hover:bg-border/40 transition-colors text-muted hover:text-foreground"
            aria-label="リアクションを追加"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <AnimatePresence>
            {showPicker && (
              <ReactionPicker
                onSelect={handleToggle}
                onClose={() => setShowPicker(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

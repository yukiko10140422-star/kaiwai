"use client";

import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { parseMessageSegments } from "@/lib/mentions";
import type { Message, MessageAttachment, MessageReaction, Profile } from "@/types/database";
import { toggleReaction, groupReactions, QUICK_EMOJIS } from "@/lib/reactions";
import ReactionBar from "./ReactionBar";
import FilePreviewModal from "./FilePreviewModal";
import UrlPreview from "./UrlPreview";

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
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
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
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    const supabase = createClient();
    supabase.storage
      .from("attachments")
      .createSignedUrl(storagePath, 3600)
      .then(({ data, error: err }) => {
        if (err || !data?.signedUrl) setError(true);
        else setUrl(data.signedUrl);
      })
      .catch(() => setError(true));
  }, [storagePath]);

  return { url, error };
}

function getFileTypeIcon(fileType: string): { icon: ReactNode; color: string } {
  if (fileType === "application/pdf") {
    return {
      color: "text-red-500",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      ),
    };
  }
  if (fileType.startsWith("audio/")) {
    return {
      color: "text-purple-500",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      ),
    };
  }
  if (
    fileType.includes("spreadsheet") ||
    fileType.includes("excel") ||
    fileType === "text/csv"
  ) {
    return {
      color: "text-green-500",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0 0c-.621 0-1.125-.504-1.125-1.125m0 0v-1.5" />
      ),
    };
  }
  if (
    fileType.includes("zip") ||
    fileType.includes("rar") ||
    fileType.includes("tar") ||
    fileType.includes("gzip") ||
    fileType.includes("7z") ||
    fileType.includes("compressed")
  ) {
    return {
      color: "text-amber-500",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      ),
    };
  }
  if (
    fileType.includes("word") ||
    fileType.includes("document") ||
    fileType === "text/plain" ||
    fileType === "text/html" ||
    fileType === "text/markdown"
  ) {
    return {
      color: "text-blue-500",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      ),
    };
  }
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) {
    return {
      color: "text-orange-500",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      ),
    };
  }
  // Default file icon
  return {
    color: "text-muted",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    ),
  };
}

function AttachmentPreview({
  attachment,
  allAttachments,
  onImageClick,
}: {
  attachment: MessageAttachment;
  allAttachments: MessageAttachment[];
  onImageClick: (index: number) => void;
}) {
  const { url, error } = useSignedUrl(attachment.storage_path);
  const isImage = attachment.file_type.startsWith("image/");
  const isVideo = attachment.file_type.startsWith("video/");
  const isAudio = attachment.file_type.startsWith("audio/");
  const isPdf = attachment.file_type === "application/pdf";
  const [imgLoaded, setImgLoaded] = useState(false);

  if (error) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-status-overdue/30 bg-status-overdue/5 px-3 py-2 mt-1 text-xs text-status-overdue">
        読み込みエラー
        <a
          href={`#`}
          onClick={(e) => { e.preventDefault(); window.location.reload(); }}
          className="text-accent hover:underline ml-1"
        >
          再読み込み
        </a>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 mt-1 text-xs text-muted">
        <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (isImage) {
    const imageAttachments = allAttachments.filter((a) => a.file_type.startsWith("image/"));
    const imageIndex = imageAttachments.findIndex((a) => a.id === attachment.id);

    return (
      <div className="relative max-w-xs mt-1">
        {!imgLoaded && (
          <div className="absolute inset-0 rounded-lg border border-border bg-card animate-pulse flex items-center justify-center">
            <svg className="w-8 h-8 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
        <img
          src={url}
          alt={attachment.file_name}
          className={`max-w-xs rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity ${imgLoaded ? "" : "invisible"}`}
          onClick={() => onImageClick(imageIndex >= 0 ? imageIndex : 0)}
          onLoad={() => setImgLoaded(true)}
          style={{ minHeight: imgLoaded ? undefined : 120 }}
        />
      </div>
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

  if (isAudio) {
    return (
      <div className="inline-flex flex-col gap-1.5 rounded-lg border border-border px-3 py-2.5 mt-1 max-w-xs">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
          <span className="text-sm truncate max-w-[200px]">{attachment.file_name}</span>
          <span className="text-xs text-muted">{formatFileSize(attachment.file_size)}</span>
        </div>
        <audio src={url} controls className="w-full h-8" />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 mt-1 text-sm hover:bg-card transition-colors">
        <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <span className="truncate max-w-[200px]">{attachment.file_name}</span>
        <span className="text-xs text-muted">{formatFileSize(attachment.file_size)}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline ml-1"
        >
          プレビュー
        </a>
        <a
          href={url}
          download={attachment.file_name}
          className="text-xs text-muted hover:text-foreground ml-1"
        >
          保存
        </a>
      </div>
    );
  }

  // Generic file with type-specific icon
  const { icon, color } = getFileTypeIcon(attachment.file_type);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 mt-1 text-sm hover:bg-card transition-colors"
    >
      <svg className={`w-4 h-4 ${color} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {icon}
      </svg>
      <span className="truncate max-w-[200px]">{attachment.file_name}</span>
      <span className="text-xs text-muted">
        {formatFileSize(attachment.file_size)}
      </span>
    </a>
  );
}

function ImageLightbox({
  attachments,
  initialIndex,
  onClose,
}: {
  attachments: MessageAttachment[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    Promise.all(
      attachments.map(async (att) => {
        const { data } = await supabase.storage
          .from("attachments")
          .createSignedUrl(att.storage_path, 3600);
        return [att.id, data?.signedUrl ?? ""] as const;
      })
    ).then((entries) => {
      setSignedUrls(Object.fromEntries(entries.filter(([, url]) => url)));
    });
  }, [attachments]);

  return (
    <FilePreviewModal
      attachments={attachments}
      initialIndex={initialIndex}
      signedUrls={signedUrls}
      onClose={onClose}
    />
  );
}

export default function MessageItem({ message, currentUserId, isGrouped = false, onThreadClick, onDelete, onEdit, memberNames = [] }: MessageItemProps) {
  const [reactions, setReactions] = useState<MessageReaction[]>(message.reactions ?? []);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const longPressTriggered = useRef(false);

  const isOwn = message.user_id === currentUserId;

  // Collect image attachments and their signed URLs for the lightbox
  const imageAttachments = useMemo(
    () => (message.attachments ?? []).filter((a) => a.file_type.startsWith("image/")),
    [message.attachments]
  );

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
      setContextMenu(false);
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

  // Long press handlers (mobile)
  const handleTouchStart = useCallback(() => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setContextMenu(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const handleTouchMove = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  // Right-click handler (PC)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu(true);
  }, []);

  return (
    <div
      className={`group relative flex gap-2 px-3 sm:px-4 py-1 ${isOwn ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar (other's messages only) */}
      <div className="w-8 shrink-0 flex items-end">
        {!isOwn && !isGrouped ? (
          <Avatar src={message.author.avatar_url} name={message.author.display_name} size="sm" />
        ) : null}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] min-w-0 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {/* Name + time */}
        {!isGrouped && (
          <div className={`flex items-baseline gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
            {!isOwn && (
              <span className="font-semibold text-xs">{message.author.display_name}</span>
            )}
            <span className="text-[10px] text-muted">{formatTime(message.created_at)}</span>
            {message.is_edited && (
              <span className="text-[10px] text-muted">(編集済み)</span>
            )}
          </div>
        )}

        {editing ? (
          <div className="flex flex-col gap-1 w-full">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none min-h-[44px]"
              rows={2}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (editContent.trim() && editContent !== message.content) {
                    onEdit?.(message.id, editContent.trim());
                  }
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setEditContent(message.content);
                  setEditing(false);
                }
              }}
            />
            <div className="flex gap-1 text-[10px] text-muted">
              <span>Enter で保存</span>
              <span>・</span>
              <span>Esc でキャンセル</span>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words select-none ${
              isOwn
                ? "bg-accent text-white rounded-br-sm"
                : "bg-card border border-border rounded-bl-sm"
            }`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onContextMenu={handleContextMenu}
          >
            {contentSegments.map((seg, i) =>
              seg.type === "mention" ? (
                <span key={i} className={`font-semibold rounded px-0.5 ${isOwn ? "text-white/90 bg-white/20" : "text-accent bg-accent/10"}`}>
                  {seg.value}
                </span>
              ) : (
                <span key={i}>{seg.value}</span>
              )
            )}
          </div>
        )}

        {/* URL Previews */}
        <UrlPreview content={message.content} />

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {message.attachments.map((att) => (
              <AttachmentPreview
                key={att.id}
                attachment={att}
                allAttachments={message.attachments!}
                onImageClick={(index) => setLightboxIndex(index)}
              />
            ))}
          </div>
        )}

        {/* Image lightbox */}
        {lightboxIndex !== null && imageAttachments.length > 0 && (
          <ImageLightbox
            attachments={imageAttachments}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}

        {/* Reactions (existing reactions always visible) */}
        <ReactionBar reactions={grouped} onToggle={handleToggle} />

        {/* Thread indicator */}
        {message.reply_count != null && message.reply_count > 0 && (
          <button
            onClick={() => onThreadClick?.(message.id)}
            className="mt-1 text-xs text-accent hover:underline"
          >
            {message.reply_count} 件の返信
          </button>
        )}
      </div>

      {/* ===== Context menu (long-press / right-click) ===== */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(false)} />
          <div
            className={`absolute z-50 ${isOwn ? "right-12" : "left-12"} top-0 bg-sidebar border border-border rounded-xl shadow-xl overflow-hidden min-w-[180px]`}
          >
            {/* Quick reactions */}
            <div className="flex gap-0.5 px-2 py-2 border-b border-border">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleToggle(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border/40 active:scale-90 transition-all text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="py-1">
              {onThreadClick && (
                <button
                  onClick={() => {
                    onThreadClick(message.id);
                    setContextMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-card transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  スレッドで返信
                </button>
              )}

              {isOwn && onEdit && (
                <button
                  onClick={() => {
                    setEditContent(message.content);
                    setEditing(true);
                    setContextMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-card transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                  </svg>
                  編集
                </button>
              )}

              {isOwn && onDelete && (
                <button
                  onClick={() => {
                    setContextMenu(false);
                    if (confirm("このメッセージを取り消しますか？")) {
                      onDelete(message.id);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-card transition-colors text-left text-status-overdue"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  取り消し
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

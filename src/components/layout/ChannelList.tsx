"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedList, { animatedListItemVariants } from "@/components/ui/AnimatedList";
import type { Channel } from "@/types/database";
import { getChannels, createChannel, deleteChannel } from "@/lib/chat";
import { getChannelUnreadCounts, subscribeToUnread, unsubscribeFromUnread } from "@/lib/unread";

interface ChannelListProps {
  isCollapsed: boolean;
}

export default function ChannelList({ isCollapsed }: ChannelListProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const pathname = usePathname();

  const refreshUnread = useCallback(() => {
    getChannelUnreadCounts()
      .then(setUnreadCounts)
      .catch(console.error);
  }, []);

  useEffect(() => {
    getChannels()
      .then(setChannels)
      .catch(console.error);
    refreshUnread();
  }, [refreshUnread]);

  // Realtime: 新メッセージで未読数を更新
  useEffect(() => {
    const sub = subscribeToUnread(refreshUnread);
    return () => unsubscribeFromUnread(sub);
  }, [refreshUnread]);

  // 現在開いているチャンネルの未読はクリア
  useEffect(() => {
    const match = pathname.match(/\/dashboard\/chat\/(.+)/);
    if (match) {
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[match[1]];
        return next;
      });
    }
  }, [pathname]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;

    try {
      const ch = await createChannel(name, "", "public");
      setChannels((prev) => [...prev, ch]);
      setNewName("");
      setIsCreating(false);
    } catch (e) {
      console.error("Failed to create channel:", e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, channelId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("このチャンネルを削除しますか？")) return;

    try {
      await deleteChannel(channelId);
      setChannels((prev) => prev.filter((ch) => ch.id !== channelId));
    } catch (e) {
      console.error("Failed to delete channel:", e);
    }
  };

  if (isCollapsed) return null;

  return (
    <div className="px-2 py-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
          チャンネル
        </span>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-muted hover:text-foreground transition-colors"
          aria-label="チャンネル作成"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Create channel input */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2 mb-1 overflow-hidden"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
              className="flex gap-1"
            >
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="チャンネル名"
                className="flex-1 h-7 rounded border border-border bg-transparent px-2 text-xs focus:outline-none focus:border-accent"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewName("");
                  }
                }}
              />
              <button
                type="submit"
                className="h-7 px-2 rounded bg-accent text-white text-xs hover:bg-accent-hover transition-colors"
              >
                追加
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Channel list */}
      <AnimatedList className="space-y-0.5">
        {channels.map((ch) => {
          const href = `/dashboard/chat/${ch.id}`;
          const isActive = pathname === href;

          return (
            <motion.div key={ch.id} variants={animatedListItemVariants}>
              <Link
                href={href}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-card hover:text-foreground"
                }`}
              >
                <span className="text-xs opacity-60">#</span>
                <span className="truncate flex-1">{ch.name}</span>
                <button
                  onClick={(e) => handleDelete(e, ch.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-muted hover:text-status-overdue transition-all"
                  aria-label="チャンネル削除"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {unreadCounts[ch.id] > 0 && (
                  <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {unreadCounts[ch.id] > 99 ? "99+" : unreadCounts[ch.id]}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}

        {channels.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted">
            チャンネルがありません
          </p>
        )}
      </AnimatedList>
    </div>
  );
}

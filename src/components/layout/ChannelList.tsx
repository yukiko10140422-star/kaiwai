"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Channel } from "@/types/database";
import { getChannels, createChannel, deleteChannel, updateReadStatus } from "@/lib/chat";
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

  // 現在開いているチャンネルの未読はクリア（ローカル＋DB）
  useEffect(() => {
    const match = pathname.match(/\/dashboard\/chat\/(.+)/);
    if (match) {
      const channelId = match[1];
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[channelId];
        return next;
      });
      updateReadStatus(channelId).catch(console.error);
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

  // Split into project channels and standalone channels
  const projectChannels = channels.filter((ch) => ch.project_id);
  const standaloneChannels = channels.filter((ch) => !ch.project_id);

  return (
    <div className="px-2 py-2 space-y-3">
      {/* Project channels */}
      {projectChannels.length > 0 && (
        <div>
          <div className="flex items-center px-2 mb-1">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              プロジェクト
            </span>
          </div>
          <div className="space-y-0.5">
            {projectChannels.map((ch) => {
              const chatHref = `/dashboard/chat/${ch.id}`;
              const isActive = pathname === chatHref;

              return (
                <div key={ch.id}>
                  <Link
                    href={chatHref}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted hover:bg-card hover:text-foreground"
                    }`}
                  >
                    {/* Folder icon for project channels */}
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 7.5A2.5 2.5 0 014.5 5h4.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19.5A2.5 2.5 0 0122 9.5v8a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 17.5v-10z" />
                    </svg>
                    <span className="truncate flex-1">{ch.name}</span>
                    {/* Project detail link */}
                    {ch.project_id && (
                      <Link
                        href={`/dashboard/projects/${ch.project_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted hover:text-accent transition-all p-0.5"
                        title="プロジェクト詳細"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-4.5h6m0 0v6m0-6L10.5 13.5" />
                        </svg>
                      </Link>
                    )}
                    {unreadCounts[ch.id] > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unreadCounts[ch.id] > 99 ? "99+" : unreadCounts[ch.id]}
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standalone channels */}
      <div>
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
        {isCreating && (
          <div className="px-2 mb-1">
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
          </div>
        )}

        <div className="space-y-0.5">
          {standaloneChannels.map((ch) => {
            const href = `/dashboard/chat/${ch.id}`;
            const isActive = pathname === href;

            return (
              <div key={ch.id}>
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
              </div>
            );
          })}

          {standaloneChannels.length === 0 && !isCreating && (
            <p className="px-3 py-2 text-xs text-muted">
              チャンネルがありません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

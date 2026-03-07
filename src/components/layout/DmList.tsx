"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui";
import type { Profile } from "@/types/database";
import {
  getDmConversations,
  getOrCreateDmConversation,
  getAllMembers,
} from "@/lib/dm";
import type { DmConversationWithParticipant } from "@/lib/dm";
import { getDmUnreadCounts, subscribeToUnread, unsubscribeFromUnread } from "@/lib/unread";

interface DmListProps {
  isCollapsed: boolean;
}

export default function DmList({ isCollapsed }: DmListProps) {
  const [conversations, setConversations] = useState<DmConversationWithParticipant[]>([]);
  const [showNewDm, setShowNewDm] = useState(false);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const pathname = usePathname();
  const router = useRouter();

  const refreshUnread = useCallback(() => {
    getDmUnreadCounts()
      .then(setUnreadCounts)
      .catch(console.error);
  }, []);

  useEffect(() => {
    getDmConversations()
      .then(setConversations)
      .catch(console.error);
    refreshUnread();
  }, [refreshUnread]);

  // Realtime: 新メッセージで未読数を更新
  useEffect(() => {
    const sub = subscribeToUnread(refreshUnread);
    return () => unsubscribeFromUnread(sub);
  }, [refreshUnread]);

  // 現在開いているDMの未読はクリア
  useEffect(() => {
    const match = pathname.match(/\/dashboard\/dm\/(.+)/);
    if (match) {
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[match[1]];
        return next;
      });
    }
  }, [pathname]);

  const handleOpenNewDm = async () => {
    if (showNewDm) {
      setShowNewDm(false);
      return;
    }
    setShowNewDm(true);
    if (members.length === 0) {
      setLoadingMembers(true);
      try {
        const m = await getAllMembers();
        setMembers(m);
      } catch (e) {
        console.error("Failed to load members:", e);
      } finally {
        setLoadingMembers(false);
      }
    }
  };

  const handleStartDm = async (otherUserId: string, profile: Profile) => {
    try {
      const conversationId = await getOrCreateDmConversation(otherUserId);
      // 一覧に追加（重複チェック）
      setConversations((prev) => {
        if (prev.some((c) => c.id === conversationId)) return prev;
        return [{ id: conversationId, created_at: new Date().toISOString(), participant: profile }, ...prev];
      });
      setShowNewDm(false);
      // ナビゲーション
      router.push(`/dashboard/dm/${conversationId}`);
    } catch (e) {
      console.error("Failed to start DM:", e);
    }
  };

  if (isCollapsed) return null;

  return (
    <div className="px-2 py-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
          ダイレクトメッセージ
        </span>
        <button
          onClick={handleOpenNewDm}
          className="text-muted hover:text-foreground transition-colors"
          aria-label="新規DM"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* New DM member selector */}
      <AnimatePresence>
        {showNewDm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2 mb-1 overflow-hidden"
          >
            <div className="border border-border rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
              {loadingMembers ? (
                <p className="text-xs text-muted py-1">読み込み中…</p>
              ) : members.length === 0 ? (
                <p className="text-xs text-muted py-1">メンバーがいません</p>
              ) : (
                members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleStartDm(m.id, m)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-card transition-colors text-left"
                  >
                    <Avatar name={m.display_name} src={m.avatar_url} size="xs" />
                    <span className="text-xs truncate">{m.display_name}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DM conversation list */}
      <div className="space-y-0.5">
        {conversations.map((conv) => {
          const href = `/dashboard/dm/${conv.id}`;
          const isActive = pathname === href;

          return (
            <Link
              key={conv.id}
              href={href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-card hover:text-foreground"
              }`}
            >
              <Avatar
                name={conv.participant.display_name}
                src={conv.participant.avatar_url}
                size="xs"
              />
              <span className="truncate flex-1">{conv.participant.display_name}</span>
              {unreadCounts[conv.id] > 0 && (
                <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCounts[conv.id] > 99 ? "99+" : unreadCounts[conv.id]}
                </span>
              )}
            </Link>
          );
        })}

        {conversations.length === 0 && !showNewDm && (
          <p className="px-3 py-2 text-xs text-muted">
            DMがありません
          </p>
        )}
      </div>
    </div>
  );
}

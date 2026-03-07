"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/ui/PageTransition";
import { Avatar } from "@/components/ui";
import type { Channel, Profile } from "@/types/database";
import { getChannels, createChannel } from "@/lib/chat";
import {
  getDmConversations,
  getOrCreateDmConversation,
  getAllMembers,
} from "@/lib/dm";
import type { DmConversationWithParticipant } from "@/lib/dm";
import {
  getChannelUnreadCounts,
  getDmUnreadCounts,
  subscribeToUnread,
  unsubscribeFromUnread,
} from "@/lib/unread";

export default function ChatListPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"channels" | "dm">("channels");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [conversations, setConversations] = useState<DmConversationWithParticipant[]>([]);
  const [channelUnread, setChannelUnread] = useState<Record<string, number>>({});
  const [dmUnread, setDmUnread] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [showNewDm, setShowNewDm] = useState(false);
  const [members, setMembers] = useState<Profile[]>([]);

  const refreshUnread = useCallback(() => {
    getChannelUnreadCounts().then(setChannelUnread).catch(console.error);
    getDmUnreadCounts().then(setDmUnread).catch(console.error);
  }, []);

  useEffect(() => {
    getChannels().then(setChannels).catch(console.error);
    getDmConversations().then(setConversations).catch(console.error);
    refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    const sub = subscribeToUnread(refreshUnread);
    return () => unsubscribeFromUnread(sub);
  }, [refreshUnread]);

  const totalChannelUnread = Object.values(channelUnread).reduce((a, b) => a + b, 0);
  const totalDmUnread = Object.values(dmUnread).reduce((a, b) => a + b, 0);

  const handleCreateChannel = async () => {
    const name = newChannelName.trim();
    if (!name) return;
    try {
      const ch = await createChannel(name, "", "public");
      setChannels((prev) => [...prev, ch]);
      setNewChannelName("");
      setShowCreate(false);
    } catch (e) {
      console.error("Failed to create channel:", e);
    }
  };

  const handleOpenNewDm = async () => {
    setShowNewDm(true);
    if (members.length === 0) {
      try {
        const m = await getAllMembers();
        setMembers(m);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleStartDm = async (userId: string, profile: Profile) => {
    try {
      const convId = await getOrCreateDmConversation(userId);
      setConversations((prev) => {
        if (prev.some((c) => c.id === convId)) return prev;
        return [{ id: convId, created_at: new Date().toISOString(), participant: profile }, ...prev];
      });
      setShowNewDm(false);
      router.push(`/dashboard/dm/${convId}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageTransition className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold">チャット</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex px-4 gap-1 mb-2">
        <button
          onClick={() => setTab("channels")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            tab === "channels" ? "bg-accent/10 text-accent" : "text-muted hover:bg-card"
          }`}
        >
          チャンネル
          {totalChannelUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
              {totalChannelUnread > 99 ? "99+" : totalChannelUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("dm")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            tab === "dm" ? "bg-accent/10 text-accent" : "text-muted hover:bg-card"
          }`}
        >
          DM
          {totalDmUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
              {totalDmUnread > 99 ? "99+" : totalDmUnread}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {tab === "channels" ? (
          <div className="space-y-1">
            {/* Create channel button */}
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border text-muted hover:text-foreground hover:border-accent/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-sm">新しいチャンネル</span>
            </button>

            <AnimatePresence>
              {showCreate && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                  onSubmit={(e) => { e.preventDefault(); handleCreateChannel(); }}
                >
                  <div className="flex gap-2 py-2">
                    <input
                      autoFocus
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="チャンネル名"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus-glow"
                      onKeyDown={(e) => { if (e.key === "Escape") setShowCreate(false); }}
                    />
                    <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium">
                      作成
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Channel list */}
            {channels.map((ch) => (
              <Link
                key={ch.id}
                href={`/dashboard/chat/${ch.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-card/80 transition-colors active:scale-[0.98]"
              >
                <span className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg shrink-0">
                  #
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ch.name}</p>
                  {ch.description && (
                    <p className="text-xs text-muted truncate">{ch.description}</p>
                  )}
                </div>
                {channelUnread[ch.id] > 0 && (
                  <span className="min-w-[22px] h-[22px] rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center px-1.5">
                    {channelUnread[ch.id] > 99 ? "99+" : channelUnread[ch.id]}
                  </span>
                )}
              </Link>
            ))}

            {channels.length === 0 && (
              <p className="text-sm text-muted text-center py-8">チャンネルがありません</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {/* New DM button */}
            <button
              onClick={handleOpenNewDm}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border text-muted hover:text-foreground hover:border-accent/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-sm">新しいメッセージ</span>
            </button>

            {/* New DM member picker */}
            <AnimatePresence>
              {showNewDm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass rounded-xl p-3 my-2 space-y-1 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted">メンバーを選択</span>
                      <button onClick={() => setShowNewDm(false)} className="text-muted hover:text-foreground text-lg leading-none">&times;</button>
                    </div>
                    {members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleStartDm(m.id, m)}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-card/80 transition-colors"
                      >
                        <Avatar name={m.display_name} src={m.avatar_url} size="sm" />
                        <span className="text-sm">{m.display_name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DM list */}
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/dashboard/dm/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-card/80 transition-colors active:scale-[0.98]"
              >
                <Avatar name={conv.participant.display_name} src={conv.participant.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.participant.display_name}</p>
                </div>
                {dmUnread[conv.id] > 0 && (
                  <span className="min-w-[22px] h-[22px] rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center px-1.5">
                    {dmUnread[conv.id] > 99 ? "99+" : dmUnread[conv.id]}
                  </span>
                )}
              </Link>
            ))}

            {conversations.length === 0 && !showNewDm && (
              <p className="text-sm text-muted text-center py-8">DMがありません</p>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

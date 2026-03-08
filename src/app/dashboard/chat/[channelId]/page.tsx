"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import ChannelHeader from "@/components/chat/ChannelHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import dynamic from "next/dynamic";
const ThreadPanel = dynamic(() => import("@/components/chat/ThreadPanel"), { ssr: false });
const FileListPanel = dynamic(() => import("@/components/chat/FileListPanel"), { ssr: false });
import type { MessageWithAuthor } from "@/components/chat/MessageItem";
import type { Channel, Profile, Message, MessageAttachment } from "@/types/database";
import {
  getChannel,
  getChannelMembers,
  getMessages,
  sendMessage,
  subscribeToChannel,
  unsubscribeFromChannel,
  updateReadStatus,
  joinChannel,
} from "@/lib/chat";
import { createClient } from "@/lib/supabase/client";

export default function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  // Load channel data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoaded(false);
      setError(null);
      setThreadMessageId(null);

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("ログインが必要です");
          return;
        }
        setCurrentUserId(user.id);

        // Fetch current user's profile for optimistic messages
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profile) setCurrentUserProfile(profile);

        await joinChannel(channelId).catch((e) =>
          console.warn("joinChannel failed (may already be member):", e)
        );

        const [ch, mem, msgs] = await Promise.all([
          getChannel(channelId),
          getChannelMembers(channelId),
          getMessages(channelId),
        ]);

        if (cancelled) return;

        if (!ch) {
          setError("チャンネルが見つかりません");
          return;
        }

        setChannel(ch);
        setMembers(mem);
        setMessages(msgs);
        setLoaded(true);
        updateReadStatus(channelId);
      } catch (e) {
        if (!cancelled) {
          setError("データの読み込みに失敗しました");
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [channelId]);

  // Realtime subscription
  useEffect(() => {
    if (!loaded) return;

    const subscription = subscribeToChannel(
      channelId,
      async (newMsg: Message) => {
        const supabase = createClient();
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

          // Only add top-level messages to the main list
          if (!fullMsg.parent_id) {
            setMessages((prev) => {
              // Check if already exists (duplicate)
              if (prev.some((m) => m.id === fullMsg.id)) return prev;
              // Replace optimistic message from the same user if content matches
              const optimisticIdx = prev.findIndex(
                (m) =>
                  m.id.startsWith("temp-") &&
                  m.user_id === fullMsg.user_id &&
                  m.content === fullMsg.content
              );
              if (optimisticIdx !== -1) {
                const next = [...prev];
                next[optimisticIdx] = fullMsg;
                return next;
              }
              return [...prev, fullMsg];
            });
          }
        }

        updateReadStatus(channelId);
      },
      (deletedId: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      }
    );

    return () => {
      unsubscribeFromChannel(subscription);
    };
  }, [channelId, loaded]);

  const handleSend = useCallback(
    async (content: string, files: File[]) => {
      const tempId = `temp-${Date.now()}`;

      // Add optimistic message immediately
      if (currentUserId && currentUserProfile) {
        const optimisticMsg: MessageWithAuthor = {
          id: tempId,
          channel_id: channelId,
          conversation_id: null,
          user_id: currentUserId,
          parent_id: null,
          content,
          is_edited: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: currentUserProfile,
          attachments: [],
        };
        setMessages((prev) => [...prev, optimisticMsg]);
      }

      try {
        await sendMessage(channelId, content, files);
      } catch (e) {
        // Remove the optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        console.error("Failed to send message:", e);
      }
    },
    [channelId, currentUserId, currentUserProfile]
  );

  const handleThreadClick = useCallback((messageId: string) => {
    setThreadMessageId(messageId);
  }, []);

  const threadParent = threadMessageId
    ? messages.find((m) => m.id === threadMessageId) ?? null
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        読み込み中...
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        {error ?? "チャンネルが見つかりません"}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChannelHeader
          channel={channel}
          members={members}
          onFilesClick={() => setShowFiles((prev) => !prev)}
        />
        <MessageList
          messages={messages}
          currentUserId={currentUserId ?? ""}
          onThreadClick={handleThreadClick}
        />
        <MessageInput onSend={handleSend} placeholder="メッセージを入力..." />
      </div>

      {/* Thread panel */}
      <AnimatePresence>
        {threadParent && (
          <ThreadPanel
            key={threadParent.id}
            parentMessage={threadParent}
            channelId={channelId}
            currentUserId={currentUserId ?? ""}
            onClose={() => setThreadMessageId(null)}
          />
        )}
      </AnimatePresence>

      {/* File list panel */}
      <AnimatePresence>
        {showFiles && (
          <FileListPanel
            channelId={channelId}
            onClose={() => setShowFiles(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

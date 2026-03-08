"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

import ChannelHeader from "@/components/chat/ChannelHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import dynamic from "next/dynamic";
const ThreadPanel = dynamic(() => import("@/components/chat/ThreadPanel"), { ssr: false });
const FileListPanel = dynamic(() => import("@/components/chat/FileListPanel"), { ssr: false });
import type { MessageWithAuthor } from "@/components/chat/MessageItem";
import type { Channel, Profile, Message, MessageAttachment, ChannelReadStatus } from "@/types/database";
import {
  getChannel,
  getChannelMembers,
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  subscribeToChannel,
  unsubscribeFromChannel,
  updateReadStatus,
  getChannelReadStatuses,
  pinMessage,
  unpinMessage,
  joinChannel,
} from "@/lib/chat";
import { fetchProjectMembers, type ProjectMemberWithProfile } from "@/lib/projects";
import PinnedMessages from "@/components/chat/PinnedMessages";
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
  const [showPins, setShowPins] = useState(false);
  const [pinRefreshKey, setPinRefreshKey] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [readStatuses, setReadStatuses] = useState<ChannelReadStatus[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});

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

        const [ch, mem, msgs, statuses] = await Promise.all([
          getChannel(channelId),
          getChannelMembers(channelId),
          getMessages(channelId),
          getChannelReadStatuses(channelId),
        ]);

        if (cancelled) return;

        if (!ch) {
          setError("チャンネルが見つかりません");
          return;
        }

        setChannel(ch);
        setMembers(mem);
        setMessages(msgs);
        setReadStatuses(statuses);

        // Fetch project member roles for role badges in chat
        if (ch.project_id) {
          try {
            const pm = await fetchProjectMembers(ch.project_id);
            const roleMap: Record<string, string[]> = {};
            for (const m of pm) {
              roleMap[m.user_id] = m.roles;
            }
            setUserRoles(roleMap);
          } catch {
            // Non-critical, ignore
          }
        }

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

  // Periodically refresh read statuses (every 10s)
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(async () => {
      try {
        const statuses = await getChannelReadStatuses(channelId);
        setReadStatuses(statuses);
      } catch (e) {
        console.error("Failed to refresh read statuses:", e);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [channelId, loaded]);

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
      },
      (updatedMsg: Message) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === updatedMsg.id
              ? { ...m, content: updatedMsg.content, is_edited: updatedMsg.is_edited, is_pinned: updatedMsg.is_pinned }
              : m
          )
        );
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

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await deleteMessage(messageId);
    } catch (e) {
      console.error("Failed to delete message:", e);
      // Re-fetch on error
      const msgs = await getMessages(channelId);
      setMessages(msgs);
    }
  }, [channelId]);

  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === messageId ? { ...m, content, is_edited: true } : m)
    );
    try {
      await editMessage(messageId, content);
    } catch (e) {
      console.error("Failed to edit message:", e);
      const msgs = await getMessages(channelId);
      setMessages(msgs);
    }
  }, [channelId]);

  const handlePinMessage = useCallback(async (messageId: string, pinned: boolean) => {
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => m.id === messageId ? { ...m, is_pinned: pinned } : m)
    );
    try {
      if (pinned) {
        await pinMessage(messageId);
      } else {
        await unpinMessage(messageId);
      }
      setPinRefreshKey((k) => k + 1);
    } catch (e) {
      console.error("Failed to pin/unpin message:", e);
      // Revert optimistic update
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, is_pinned: !pinned } : m)
      );
    }
  }, []);

  const handleUnpinFromPanel = useCallback(async (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === messageId ? { ...m, is_pinned: false } : m)
    );
    try {
      await unpinMessage(messageId);
      setPinRefreshKey((k) => k + 1);
    } catch (e) {
      console.error("Failed to unpin message:", e);
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, is_pinned: true } : m)
      );
    }
  }, []);

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
        <div className="relative">
          <ChannelHeader
            channel={channel}
            members={members}
            onFilesClick={() => setShowFiles((prev) => !prev)}
            onPinsClick={() => setShowPins((prev) => !prev)}
            showPins={showPins}
            projectId={channel.project_id}
          />
          <PinnedMessages
            channelId={channelId}
            open={showPins}
            onClose={() => setShowPins(false)}
            onUnpin={handleUnpinFromPanel}
            refreshKey={pinRefreshKey}
          />
        </div>
        <MessageList
          messages={messages}
          currentUserId={currentUserId ?? ""}
          onThreadClick={handleThreadClick}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          onPinMessage={handlePinMessage}
          readStatuses={readStatuses}
          userRoles={userRoles}
        />
        <MessageInput onSend={handleSend} placeholder="メッセージを入力..." />
      </div>

      {/* Thread panel */}
      {threadParent && (
        <ThreadPanel
          key={threadParent.id}
          parentMessage={threadParent}
          channelId={channelId}
          currentUserId={currentUserId ?? ""}
          onClose={() => setThreadMessageId(null)}
        />
      )}

      {/* File list panel */}
      {showFiles && (
        <FileListPanel
          channelId={channelId}
          onClose={() => setShowFiles(false)}
        />
      )}
    </div>
  );
}

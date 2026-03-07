"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Avatar } from "@/components/ui";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import type { MessageWithAuthor } from "@/components/chat/MessageItem";
import type { Message, Profile, MessageAttachment } from "@/types/database";
import {
  getDmMessages,
  sendDmMessage,
  subscribeToDm,
  unsubscribeFromDm,
  updateDmReadStatus,
} from "@/lib/dm";
import { createClient } from "@/lib/supabase/client";

export default function DmPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [participant, setParticipant] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUserRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("ログインが必要です");
          return;
        }
        currentUserRef.current = user.id;

        // 相手のプロフィールを取得
        const { data: participants } = await supabase
          .from("dm_participants")
          .select("user_id, profiles(*)")
          .eq("conversation_id", conversationId)
          .neq("user_id", user.id);

        if (participants && participants.length > 0) {
          const profile = (participants[0] as Record<string, unknown>).profiles as Profile;
          setParticipant(profile);
        }

        const msgs = await getDmMessages(conversationId);
        if (cancelled) return;

        setMessages(msgs);
        updateDmReadStatus(conversationId);
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
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    const subscription = subscribeToDm(
      conversationId,
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

          setMessages((prev) => {
            if (prev.some((m) => m.id === fullMsg.id)) return prev;
            return [...prev, fullMsg];
          });
        }

        updateDmReadStatus(conversationId);
      },
      (deletedId: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      }
    );

    return () => {
      unsubscribeFromDm(subscription);
    };
  }, [conversationId]);

  const handleSend = useCallback(
    async (content: string, files: File[] = []) => {
      try {
        await sendDmMessage(conversationId, content, files);
      } catch (e) {
        console.error("Failed to send DM:", e);
      }
    },
    [conversationId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* DM Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        {participant && (
          <>
            <Avatar
              name={participant.display_name}
              src={participant.avatar_url}
              size="sm"
            />
            <div>
              <h2 className="font-semibold text-sm">{participant.display_name}</h2>
              <p className="text-xs text-muted">ダイレクトメッセージ</p>
            </div>
          </>
        )}
      </div>

      <MessageList messages={messages} currentUserId={currentUserRef.current ?? ""} />
      <MessageInput
        onSend={handleSend}
        placeholder="メッセージを入力..."
      />
    </div>
  );
}

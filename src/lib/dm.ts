import { createClient } from "@/lib/supabase/client";
import type { Message, Profile, MessageAttachment } from "@/types/database";
import type { MessageWithAuthor } from "@/components/chat/MessageItem";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface DmConversationWithParticipant {
  id: string;
  created_at: string;
  participant: Profile;
}

/**
 * 自分が参加しているDM会話の一覧を取得（相手のプロフィール付き）
 */
export async function getDmConversations(): Promise<DmConversationWithParticipant[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 自分が参加しているconversation_idを取得
  const { data: myParticipations, error: pErr } = await supabase
    .from("dm_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (pErr) throw pErr;
  if (!myParticipations || myParticipations.length === 0) return [];

  const conversationIds = myParticipations.map((p) => p.conversation_id);

  // 相手の参加者情報を取得
  const { data: otherParticipants, error: oErr } = await supabase
    .from("dm_participants")
    .select("conversation_id, user_id, profiles(*)")
    .in("conversation_id", conversationIds)
    .neq("user_id", user.id);

  if (oErr) throw oErr;

  // conversation の created_at を取得
  const { data: conversations, error: cErr } = await supabase
    .from("dm_conversations")
    .select("id, created_at")
    .in("id", conversationIds)
    .order("created_at", { ascending: false });

  if (cErr) throw cErr;

  const participantMap = new Map<string, Profile>();
  for (const row of otherParticipants ?? []) {
    const profile = row.profiles as unknown as Profile;
    if (profile) participantMap.set(row.conversation_id, profile);
  }

  return (conversations ?? [])
    .filter((c) => participantMap.has(c.id))
    .map((c) => ({
      id: c.id,
      created_at: c.created_at,
      participant: participantMap.get(c.id)!,
    }));
}

/**
 * 特定のユーザーとのDM会話を取得（なければ作成）
 */
export async function getOrCreateDmConversation(otherUserId: string): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 既存の会話を検索
  const { data: myConvos } = await supabase
    .from("dm_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (myConvos && myConvos.length > 0) {
    const myConvoIds = myConvos.map((c) => c.conversation_id);
    const { data: shared } = await supabase
      .from("dm_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myConvoIds);

    if (shared && shared.length > 0) {
      return shared[0].conversation_id;
    }
  }

  // 新規作成
  const { data: newConvo, error: createErr } = await supabase
    .from("dm_conversations")
    .insert({})
    .select()
    .single();

  if (createErr) throw createErr;

  // 両方の参加者を追加
  const { error: joinErr } = await supabase
    .from("dm_participants")
    .insert([
      { conversation_id: newConvo.id, user_id: user.id },
      { conversation_id: newConvo.id, user_id: otherUserId },
    ]);

  if (joinErr) throw joinErr;

  return newConvo.id;
}

/**
 * DM会話のメッセージを取得
 */
export async function getDmMessages(
  conversationId: string,
  limit = 50
): Promise<MessageWithAuthor[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles(*), message_attachments(*)")
    .eq("conversation_id", conversationId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? [])
    .map((row: Record<string, unknown>) => ({
      ...(row as unknown as Message),
      author: row.profiles as Profile,
      attachments: (row.message_attachments as MessageAttachment[]) ?? [],
    }))
    .reverse();
}

/**
 * DMメッセージを送信（ファイル添付対応）
 */
export async function sendDmMessage(
  conversationId: string,
  content: string,
  files: File[] = []
): Promise<Message> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: null,
      conversation_id: conversationId,
      user_id: user.id,
      parent_id: null,
      content,
      is_edited: false,
    })
    .select()
    .single();

  if (error) throw error;

  // Upload attachments
  if (files.length > 0) {
    await Promise.all(
      files.map((file) => uploadDmAttachment(data.id, conversationId, file))
    );
  }

  return data;
}

async function uploadDmAttachment(
  messageId: string,
  conversationId: string,
  file: File
): Promise<MessageAttachment> {
  const supabase = createClient();
  const filePath = `dm/${conversationId}/${messageId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: attachment, error } = await supabase
    .from("message_attachments")
    .insert({
      message_id: messageId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: filePath,
    })
    .select()
    .single();

  if (error) throw error;
  return attachment;
}

/**
 * DM会話のリアルタイム購読
 */
export function subscribeToDm(
  conversationId: string,
  onNewMessage: (message: Message) => void,
  onDeleteMessage?: (messageId: string) => void
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel(`dm:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onDeleteMessage?.(payload.old.id as string);
      }
    )
    .subscribe();
}

export function unsubscribeFromDm(subscription: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(subscription);
}

/**
 * DM既読ステータスを更新
 */
export async function updateDmReadStatus(conversationId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("dm_read_status")
    .upsert({
      conversation_id: conversationId,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    });
}

/**
 * メンバー一覧を取得（DM開始用）
 */
export async function getAllMembers(): Promise<Profile[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id)
    .order("display_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

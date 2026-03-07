import { createClient } from "@/lib/supabase/client";
import type { Channel, Message, Profile, MessageAttachment } from "@/types/database";
import type { MessageWithAuthor } from "@/components/chat/MessageItem";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ============================================================
// Channels
// ============================================================

export async function getChannels(): Promise<Channel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getChannel(channelId: string): Promise<Channel | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single();

  if (error) return null;
  return data;
}

export async function createChannel(
  name: string,
  description: string,
  type: "public" | "private"
): Promise<Channel> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("channels")
    .insert({ name, description, type, created_by: user.id })
    .select()
    .single();

  if (error) throw error;

  // Creator automatically joins
  await joinChannel(data.id);

  return data;
}

export async function deleteChannel(channelId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("channels")
    .delete()
    .eq("id", channelId);

  if (error) throw error;
}

// ============================================================
// Channel Members
// ============================================================

export async function getChannelMembers(channelId: string): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("channel_members")
    .select("user_id, profiles(*)")
    .eq("channel_id", channelId);

  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => row.profiles as Profile);
}

export async function joinChannel(channelId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("channel_members")
    .upsert({ channel_id: channelId, user_id: user.id });

  if (error) throw error;
}

export async function leaveChannel(channelId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("channel_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) throw error;
}

// ============================================================
// Messages
// ============================================================

export async function getMessages(
  channelId: string,
  limit = 50,
  before?: string
): Promise<MessageWithAuthor[]> {
  const supabase = createClient();
  let query = supabase
    .from("messages")
    .select("*, profiles(*), message_attachments(*)")
    .eq("channel_id", channelId)
    .is("parent_id", null) // top-level messages only
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Map to MessageWithAuthor and reverse to chronological order
  return (data ?? [])
    .map((row: Record<string, unknown>) => ({
      ...(row as unknown as Message),
      author: row.profiles as Profile,
      attachments: (row.message_attachments as MessageAttachment[]) ?? [],
    }))
    .reverse();
}

export async function sendMessage(
  channelId: string,
  content: string,
  files: File[] = []
): Promise<Message> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Insert message
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      channel_id: channelId,
      conversation_id: null,
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
      files.map((file) => uploadAttachment(supabase, message.id, channelId, file))
    );
  }

  return message;
}

export async function editMessage(
  messageId: string,
  content: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .update({ content, is_edited: true })
    .eq("id", messageId);

  if (error) throw error;
}

export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  if (error) throw error;
}

// ============================================================
// Thread replies
// ============================================================

export async function getThreadReplies(parentId: string): Promise<MessageWithAuthor[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles(*), message_attachments(*)")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as Message),
    author: row.profiles as Profile,
    attachments: (row.message_attachments as MessageAttachment[]) ?? [],
  }));
}

export async function sendThreadReply(
  channelId: string,
  parentId: string,
  content: string
): Promise<Message> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: channelId,
      conversation_id: null,
      user_id: user.id,
      parent_id: parentId,
      content,
      is_edited: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// File attachments
// ============================================================

async function uploadAttachment(
  supabase: ReturnType<typeof createClient>,
  messageId: string,
  channelId: string,
  file: File
): Promise<MessageAttachment> {
  const filePath = `channels/${channelId}/${messageId}/${Date.now()}_${file.name}`;

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

// ============================================================
// Read status
// ============================================================

export async function updateReadStatus(channelId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("channel_read_status")
    .upsert({
      channel_id: channelId,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    });

  if (error) throw error;
}

// ============================================================
// Realtime subscription
// ============================================================

export function subscribeToChannel(
  channelId: string,
  onNewMessage: (message: Message) => void,
  onDeleteMessage?: (messageId: string) => void
): RealtimeChannel {
  const supabase = createClient();
  return supabase
    .channel(`messages:${channelId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `channel_id=eq.${channelId}`,
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
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        onDeleteMessage?.(payload.old.id as string);
      }
    )
    .subscribe();
}

export function unsubscribeFromChannel(subscription: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(subscription);
}

import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UnreadCounts {
  channels: Record<string, number>; // channelId -> unread count
  dms: Record<string, number>; // conversationId -> unread count
}

/**
 * チャンネルごとの未読メッセージ数を取得
 */
export async function getChannelUnreadCounts(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  // 自分が参加しているチャンネルの既読状況を取得
  const { data: readStatuses, error: rsErr } = await supabase
    .from("channel_read_status")
    .select("channel_id, last_read_at")
    .eq("user_id", user.id);

  if (rsErr) {
    console.error("Failed to fetch channel read status:", rsErr);
    return {};
  }

  // 自分が参加しているチャンネルを取得
  const { data: memberships, error: mErr } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("user_id", user.id);

  if (mErr) {
    console.error("Failed to fetch channel memberships:", mErr);
    return {};
  }

  if (!memberships || memberships.length === 0) return {};

  const readMap = new Map<string, string>();
  for (const rs of readStatuses ?? []) {
    readMap.set(rs.channel_id, rs.last_read_at);
  }

  const counts: Record<string, number> = {};

  // 各チャンネルの未読数をカウント
  await Promise.all(
    memberships.map(async ({ channel_id }) => {
      const lastReadAt = readMap.get(channel_id);

      let query = supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("channel_id", channel_id)
        .is("parent_id", null)
        .neq("user_id", user.id);

      if (lastReadAt) {
        query = query.gt("created_at", lastReadAt);
      }

      const { count } = await query;
      if (count && count > 0) {
        counts[channel_id] = count;
      }
    })
  );

  return counts;
}

/**
 * DM会話ごとの未読メッセージ数を取得
 */
export async function getDmUnreadCounts(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  // 自分が参加しているDM会話を取得
  const { data: participations, error: pErr } = await supabase
    .from("dm_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (pErr) {
    console.error("Failed to fetch DM participations:", pErr);
    return {};
  }

  if (!participations || participations.length === 0) return {};

  // DM既読状況を取得
  const conversationIds = participations.map((p) => p.conversation_id);
  const { data: readStatuses, error: rsErr } = await supabase
    .from("dm_read_status")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id)
    .in("conversation_id", conversationIds);

  if (rsErr) {
    console.error("Failed to fetch DM read status:", rsErr);
    return {};
  }

  const readMap = new Map<string, string>();
  for (const rs of readStatuses ?? []) {
    readMap.set(rs.conversation_id, rs.last_read_at);
  }

  const counts: Record<string, number> = {};

  await Promise.all(
    conversationIds.map(async (conversation_id) => {
      const lastReadAt = readMap.get(conversation_id);

      let query = supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversation_id)
        .is("parent_id", null)
        .neq("user_id", user.id);

      if (lastReadAt) {
        query = query.gt("created_at", lastReadAt);
      }

      const { count } = await query;
      if (count && count > 0) {
        counts[conversation_id] = count;
      }
    })
  );

  return counts;
}

/**
 * 全メッセージテーブルの変更をリアルタイム購読し、未読数を更新
 */
export function subscribeToUnread(
  onUpdate: () => void
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel("unread-watcher")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();
}

export function unsubscribeFromUnread(subscription: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(subscription);
}

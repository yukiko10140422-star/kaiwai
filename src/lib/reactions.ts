import { createClient } from "@/lib/supabase/client";
import type { MessageReaction } from "@/types/database";

/** よく使う絵文字一覧 */
export const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "👀", "🙏", "🔥", "✅"] as const;

/** 絵文字ごとにグループ化したリアクション */
export interface GroupedReaction {
  emoji: string;
  count: number;
  userIds: string[];
  reacted: boolean; // 自分がリアクション済みか
}

/**
 * メッセージのリアクション一覧を取得する
 */
export async function fetchReactions(messageId: string): Promise<MessageReaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("message_reactions")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MessageReaction[];
}

/**
 * 複数メッセージのリアクションをまとめて取得する
 */
export async function fetchReactionsForMessages(
  messageIds: string[]
): Promise<Map<string, MessageReaction[]>> {
  if (messageIds.length === 0) return new Map();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("message_reactions")
    .select("*")
    .in("message_id", messageIds)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const map = new Map<string, MessageReaction[]>();
  for (const reaction of (data ?? []) as MessageReaction[]) {
    const existing = map.get(reaction.message_id) || [];
    existing.push(reaction);
    map.set(reaction.message_id, existing);
  }
  return map;
}

/**
 * リアクションをトグルする（追加 or 削除）
 * @returns true=追加, false=削除
 */
export async function toggleReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<boolean> {
  const supabase = createClient();

  // 既存チェック
  const { data: existing } = await supabase
    .from("message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    // 削除
    const { error } = await supabase
      .from("message_reactions")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
    return false;
  } else {
    // 追加
    const { error } = await supabase
      .from("message_reactions")
      .insert({ message_id: messageId, user_id: userId, emoji });
    if (error) throw error;
    return true;
  }
}

/**
 * リアクション配列を絵文字ごとにグループ化する
 */
export function groupReactions(
  reactions: MessageReaction[],
  currentUserId: string
): GroupedReaction[] {
  const map = new Map<string, { count: number; userIds: string[] }>();

  for (const r of reactions) {
    const entry = map.get(r.emoji) || { count: 0, userIds: [] };
    entry.count++;
    entry.userIds.push(r.user_id);
    map.set(r.emoji, entry);
  }

  return Array.from(map.entries()).map(([emoji, { count, userIds }]) => ({
    emoji,
    count,
    userIds,
    reacted: userIds.includes(currentUserId),
  }));
}

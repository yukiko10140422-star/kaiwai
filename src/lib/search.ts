import { createClient } from "@/lib/supabase/client";

export interface SearchResult {
  id: string;
  content: string;
  created_at: string;
  channel_id: string;
  channel_name: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
}

/**
 * メッセージをキーワードで検索する
 */
export async function searchMessages(
  query: string,
  channelId?: string,
  limit = 50
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const supabase = createClient();

  let q = supabase
    .from("messages")
    .select(
      `
      id,
      content,
      created_at,
      channel_id,
      user_id,
      channels!inner ( name ),
      profiles!inner ( display_name, avatar_url )
    `
    )
    .ilike("content", `%${query.replace(/[%_\\]/g, "\\$&")}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (channelId) {
    q = q.eq("channel_id", channelId);
  }

  const { data, error } = await q;

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const channel = row.channels as Record<string, unknown> | null;
    const profile = row.profiles as Record<string, unknown> | null;
    return {
      id: row.id as string,
      content: row.content as string,
      created_at: row.created_at as string,
      channel_id: row.channel_id as string,
      channel_name: (channel?.name as string) ?? "",
      author_id: row.user_id as string,
      author_name: (profile?.display_name as string) ?? "Unknown",
      author_avatar_url: (profile?.avatar_url as string | null) ?? null,
    };
  });
}

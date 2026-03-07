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

/** SQL wildcards をエスケープする */
function escapeWildcards(query: string): string {
  return query.replace(/[%_\\]/g, "\\$&");
}

export interface TaskSearchResult {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_name: string | null;
  assignee_avatar_url: string | null;
}

export interface ChannelSearchResult {
  id: string;
  name: string;
  type: string;
  description: string | null;
}

/**
 * タスクをキーワードで検索する
 */
export async function searchTasks(
  query: string,
  limit = 20
): Promise<TaskSearchResult[]> {
  if (!query.trim()) return [];

  const supabase = createClient();
  const escaped = escapeWildcards(query.trim());

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      description,
      status,
      priority,
      assignee:profiles!tasks_assignee_id_fkey ( display_name, avatar_url )
    `
    )
    .or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const assignee = row.assignee as Record<string, unknown> | null;
    return {
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      status: row.status as string,
      priority: row.priority as string,
      assignee_name: (assignee?.display_name as string | null) ?? null,
      assignee_avatar_url: (assignee?.avatar_url as string | null) ?? null,
    };
  });
}

/**
 * チャンネルを名前で検索する
 */
export async function searchChannels(
  query: string,
  limit = 10
): Promise<ChannelSearchResult[]> {
  if (!query.trim()) return [];

  const supabase = createClient();
  const escaped = escapeWildcards(query.trim());

  const { data, error } = await supabase
    .from("channels")
    .select("id, name, type, description")
    .ilike("name", `%${escaped}%`)
    .order("name")
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    description: (row.description as string | null) ?? null,
  }));
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
    .ilike("content", `%${escapeWildcards(query.trim())}%`)
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

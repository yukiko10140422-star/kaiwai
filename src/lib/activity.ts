import { createClient } from "@/lib/supabase/client";
import type { ActivityLog, ActivityAction, Profile } from "@/types/database";

export interface ActivityLogWithUser extends ActivityLog {
  user: Pick<Profile, "display_name" | "avatar_url">;
}

export async function fetchActivityLogs(limit = 20): Promise<ActivityLogWithUser[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*, user:profiles(display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ActivityLogWithUser[];
}

export function getActionLabel(action: ActivityAction): string {
  const labels: Record<ActivityAction, string> = {
    task_created: "タスクを作成",
    task_updated: "タスクを更新",
    task_completed: "タスクを完了",
    task_assigned: "タスクを割り当て",
    message_sent: "メッセージを送信",
    channel_created: "チャンネルを作成",
    member_joined: "メンバーが参加",
    file_uploaded: "ファイルをアップロード",
  };
  return labels[action] ?? action;
}

export function getActionIcon(action: ActivityAction): string {
  const icons: Record<ActivityAction, string> = {
    task_created: "clipboard",
    task_updated: "edit",
    task_completed: "check",
    task_assigned: "user",
    message_sent: "message",
    channel_created: "hash",
    member_joined: "user-plus",
    file_uploaded: "paperclip",
  };
  return icons[action] ?? "activity";
}

export async function logActivity(
  action: ActivityAction,
  targetType: string,
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    metadata: metadata ?? null,
  });
}

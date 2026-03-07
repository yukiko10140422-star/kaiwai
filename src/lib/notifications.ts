import { createClient } from "@/lib/supabase/client";
import type { Notification, NotificationType } from "@/types/database";

/**
 * 通知を取得する（新しい順）
 */
export async function fetchNotifications(userId: string, limit = 30): Promise<Notification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Notification[];
}

/**
 * 未読通知の件数を取得する
 */
export async function fetchUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

/**
 * 通知を既読にする
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

/**
 * 全通知を既読にする
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

/**
 * 通知のリアルタイム購読を開始する
 * @returns unsubscribe 関数
 */
export function subscribeToNotifications(
  userId: string,
  onNew: (notification: Notification) => void
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNew(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 通知タイプに対応するアイコン名を返す
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "mention":
      return "AtSign";
    case "task_assigned":
      return "ClipboardList";
    case "task_due":
      return "Clock";
    case "task_comment":
      return "MessageSquare";
    case "channel_invite":
      return "UserPlus";
    case "dm_message":
      return "Mail";
    default:
      return "Bell";
  }
}

/**
 * 通知の相対時刻を返す（例: "3分前", "1時間前"）
 */
export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diff = now - date;

  if (diff < 0 || isNaN(diff)) return "たった今";

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "たった今";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;

  return new Date(dateString).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

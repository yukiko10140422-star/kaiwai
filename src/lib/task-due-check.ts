import { createClient } from "@/lib/supabase/client";

/**
 * タスクの期限をチェックし、期限切れ・本日期限・明日期限の通知を作成する
 * 1日1回、セッション単位で実行される想定
 */
export async function checkTaskDueNotifications(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = now.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Get tasks that are not done and have a due date
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, status, assignee_id")
    .neq("status", "done")
    .not("due_date", "is", null);

  if (!tasks || tasks.length === 0) return;

  // Also check task_assignees for multi-assignee tasks
  const { data: assignments } = await supabase
    .from("task_assignees")
    .select("task_id")
    .eq("user_id", user.id);

  const assignedTaskIds = new Set([
    ...(assignments ?? []).map((a) => a.task_id),
    ...tasks.filter((t) => t.assignee_id === user.id).map((t) => t.id),
  ]);

  // Check for already-sent notifications today to avoid duplicates
  const { data: existing } = await supabase
    .from("notifications")
    .select("reference_id")
    .eq("user_id", user.id)
    .eq("type", "task_due")
    .gte("created_at", todayStr);

  const alreadyNotified = new Set((existing ?? []).map((n) => n.reference_id));

  const notifications: {
    user_id: string;
    type: "task_due";
    title: string;
    body: string;
    reference_id: string;
    is_read: boolean;
  }[] = [];

  for (const task of tasks) {
    if (!assignedTaskIds.has(task.id)) continue;
    if (alreadyNotified.has(task.id)) continue;
    if (!task.due_date) continue;

    const dueDate = task.due_date as string;

    if (dueDate < todayStr) {
      // Overdue
      notifications.push({
        user_id: user.id,
        type: "task_due",
        title: "期限切れのタスク",
        body: `「${task.title}」の期限が過ぎています`,
        reference_id: task.id,
        is_read: false,
      });
    } else if (dueDate === todayStr) {
      // Due today
      notifications.push({
        user_id: user.id,
        type: "task_due",
        title: "本日期限のタスク",
        body: `「${task.title}」の期限は今日です`,
        reference_id: task.id,
        is_read: false,
      });
    } else if (dueDate === tomorrowStr) {
      // Due tomorrow
      notifications.push({
        user_id: user.id,
        type: "task_due",
        title: "明日期限のタスク",
        body: `「${task.title}」の期限は明日です`,
        reference_id: task.id,
        is_read: false,
      });
    }
  }

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }
}

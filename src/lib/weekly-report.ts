import { createClient } from "@/lib/supabase/client";

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  completedTasks: { id: string; title: string; completed_at: string }[];
  newTasks: { id: string; title: string }[];
  meetingNotes: { id: string; title: string; meeting_date: string }[];
  activityCount: number;
  memberStats: { name: string; completedCount: number }[];
}

export async function generateWeeklyReport(
  weekOffset = 0
): Promise<WeeklyReport> {
  const supabase = createClient();

  // Calculate week boundaries (Monday to Sunday)
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset - weekOffset * 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const startStr = weekStart.toISOString();
  const endStr = weekEnd.toISOString();

  // Fetch completed tasks this week
  const { data: completedTasks } = await supabase
    .from("tasks")
    .select("id, title, updated_at")
    .eq("status", "done")
    .gte("updated_at", startStr)
    .lte("updated_at", endStr)
    .order("updated_at", { ascending: false });

  // Fetch newly created tasks this week
  const { data: newTasks } = await supabase
    .from("tasks")
    .select("id, title")
    .gte("created_at", startStr)
    .lte("created_at", endStr)
    .order("created_at", { ascending: false });

  // Fetch meeting notes this week
  const { data: notes } = await supabase
    .from("meeting_notes")
    .select("id, title, meeting_date")
    .gte("meeting_date", weekStart.toISOString().split("T")[0])
    .lte("meeting_date", weekEnd.toISOString().split("T")[0])
    .order("meeting_date", { ascending: false });

  // Fetch activity count
  const { count: activityCount } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startStr)
    .lte("created_at", endStr);

  // Member stats: who completed the most tasks
  const { data: memberTasks } = await supabase
    .from("tasks")
    .select("assignee_id, profiles!tasks_assignee_id_fkey(display_name)")
    .eq("status", "done")
    .gte("updated_at", startStr)
    .lte("updated_at", endStr);

  // Group by member
  const memberMap = new Map<string, { name: string; count: number }>();
  for (const t of memberTasks ?? []) {
    if (!t.assignee_id) continue;
    const profile = t.profiles as unknown as { display_name: string } | null;
    const name = profile?.display_name ?? "不明";
    const existing = memberMap.get(t.assignee_id);
    if (existing) {
      existing.count++;
    } else {
      memberMap.set(t.assignee_id, { name, count: 1 });
    }
  }

  return {
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
    completedTasks: (completedTasks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      completed_at: t.updated_at,
    })),
    newTasks: (newTasks ?? []).map((t) => ({ id: t.id, title: t.title })),
    meetingNotes: (notes ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      meeting_date: n.meeting_date,
    })),
    activityCount: activityCount ?? 0,
    memberStats: Array.from(memberMap.values())
      .map((m) => ({ name: m.name, completedCount: m.count }))
      .sort((a, b) => b.completedCount - a.completedCount),
  };
}

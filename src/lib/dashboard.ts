import { createClient } from "@/lib/supabase/client";

export interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  review: number;
  overdue: number;
}

export interface MemberStat {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  totalTasks: number;
  completedTasks: number;
}

export interface ProjectProgress {
  name: string;
  value: number; // 0-100
}

export interface CalendarTask {
  id: string;
  title: string;
  due_date: string;
  status: "todo" | "in_progress" | "review" | "done";
}

/**
 * タスク統計サマリーを取得
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const { data, error } = await supabase.from("tasks").select("status, due_date");

  if (error) throw error;

  const tasks = data ?? [];
  const now = new Date();

  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "done").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    overdue: tasks.filter(
      (t) => t.status !== "done" && t.due_date && new Date(t.due_date) < now
    ).length,
  };
}

/**
 * メンバー別タスク進捗を取得
 */
export async function fetchMemberProgress(): Promise<MemberStat[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("status, assignee_id, profiles!tasks_assignee_id_fkey ( id, display_name, avatar_url )")
    .not("assignee_id", "is", null);

  if (error) throw error;

  const memberMap = new Map<string, MemberStat>();

  for (const task of data ?? []) {
    const raw = task.profiles as unknown;
    const profile = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | null;
    if (!profile) continue;

    const id = profile.id as string;
    if (!memberMap.has(id)) {
      memberMap.set(id, {
        id,
        displayName: (profile.display_name as string) ?? "Unknown",
        avatarUrl: (profile.avatar_url as string | null) ?? null,
        totalTasks: 0,
        completedTasks: 0,
      });
    }

    const member = memberMap.get(id)!;
    member.totalTasks++;
    if (task.status === "done") member.completedTasks++;
  }

  return Array.from(memberMap.values());
}

/**
 * プロジェクト別進捗率を取得
 */
export async function fetchProjectProgress(): Promise<ProjectProgress[]> {
  const supabase = createClient();

  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id, name");

  if (pErr) throw pErr;

  if (!projects || projects.length === 0) return [];

  const { data: tasks, error: tErr } = await supabase
    .from("tasks")
    .select("project_id, status");

  if (tErr) throw tErr;

  return projects.map((project) => {
    const projectTasks = (tasks ?? []).filter((t) => t.project_id === project.id);
    const done = projectTasks.filter((t) => t.status === "done").length;
    const total = projectTasks.length;
    return {
      name: project.name,
      value: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
}

/**
 * 期限付きタスクをカレンダー用に取得
 */
export async function fetchCalendarTasks(): Promise<CalendarTask[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, status")
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date!,
    status: t.status as CalendarTask["status"],
  }));
}

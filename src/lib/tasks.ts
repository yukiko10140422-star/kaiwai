import { createClient } from "@/lib/supabase/client";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  Subtask,
  Label,
  TaskComment,
  Profile,
} from "@/types/database";
import type { TaskCardData } from "@/components/tasks/TaskCard";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ============================================================
// Task CRUD
// ============================================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  assignee_ids?: string[];
  project_id?: string | null;
  channel_id?: string | null;
  due_date?: string | null;
  position?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
  position?: number;
}

/** Fetch tasks with joined assignees, labels, channel, and subtask counts */
export async function fetchTasks(projectId?: string): Promise<TaskCardData[]> {
  const supabase = createClient();

  let query = supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(display_name, avatar_url),
      task_assignees(user_id, profiles(id, display_name, avatar_url)),
      channel:channels!tasks_channel_id_fkey(id, name),
      task_labels(label_id, labels(*)),
      subtasks(id, is_completed)
    `)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const subtasks = (row.subtasks as { id: string; is_completed: boolean }[]) ?? [];
    const labels = (row.task_labels as { label_id: string; labels: Label }[])?.map(
      (tl) => tl.labels
    ) ?? [];
    const assignees = (row.task_assignees as { user_id: string; profiles: Pick<Profile, "id" | "display_name" | "avatar_url"> }[])?.map(
      (ta) => ta.profiles
    ) ?? [];

    return {
      ...row,
      assignee: row.assignee ?? null,
      assignees,
      channel: row.channel ?? null,
      labels,
      subtask_total: subtasks.length,
      subtask_done: subtasks.filter((s) => s.is_completed).length,
      task_labels: undefined,
      task_assignees: undefined,
      subtasks: undefined,
    } as unknown as TaskCardData;
  });
}

/** Create a new task */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { assignee_ids, ...taskInput } = input;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...taskInput,
      created_by: user.id,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      position: input.position ?? 0,
    })
    .select()
    .single();

  if (error) throw error;

  // 複数アサイン
  if (assignee_ids && assignee_ids.length > 0) {
    await setTaskAssignees(data.id, assignee_ids);
  }

  return data;
}

/** Set task assignees (replace all) */
export async function setTaskAssignees(taskId: string, userIds: string[]): Promise<void> {
  const supabase = createClient();

  // 既存を削除
  await supabase.from("task_assignees").delete().eq("task_id", taskId);

  // 新規追加
  if (userIds.length > 0) {
    const { error } = await supabase
      .from("task_assignees")
      .insert(userIds.map((user_id) => ({ task_id: taskId, user_id })));
    if (error) throw error;
  }
}

/** Fetch channels for task association */
export async function fetchChannels(): Promise<{ id: string; name: string }[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("channels")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

/** Update an existing task */
export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update(input)
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update task status (convenience for drag-and-drop) */
export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) throw error;
}

/** Delete a task */
export async function deleteTask(taskId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

// ============================================================
// Subtasks
// ============================================================

export async function fetchSubtasks(taskId: string): Promise<Subtask[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subtasks")
    .select("*")
    .eq("task_id", taskId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createSubtask(
  taskId: string,
  title: string,
  position?: number
): Promise<Subtask> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subtasks")
    .insert({ task_id: taskId, title, position: position ?? 0 })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("subtasks")
    .update({ is_completed: isCompleted })
    .eq("id", subtaskId);

  if (error) throw error;
}

export async function deleteSubtask(subtaskId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);
  if (error) throw error;
}

// ============================================================
// Labels
// ============================================================

export async function fetchLabels(): Promise<Label[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("labels")
    .select("*")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function addLabelToTask(taskId: string, labelId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("task_labels")
    .insert({ task_id: taskId, label_id: labelId });

  if (error) throw error;
}

export async function removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("task_labels")
    .delete()
    .eq("task_id", taskId)
    .eq("label_id", labelId);

  if (error) throw error;
}

// ============================================================
// Task Comments
// ============================================================

export async function fetchTaskComments(taskId: string): Promise<(TaskComment & { author: Pick<Profile, "display_name" | "avatar_url"> })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("task_comments")
    .select(`
      *,
      author:profiles!task_comments_user_id_fkey(display_name, avatar_url)
    `)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createTaskComment(taskId: string, content: string): Promise<TaskComment> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, user_id: user.id, content })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// Projects (for filtering)
// ============================================================

export async function fetchProjects(): Promise<{ id: string; name: string }[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

// ============================================================
// Members (for assignee options)
// ============================================================

export async function fetchMembers(): Promise<Pick<Profile, "id" | "display_name" | "avatar_url">[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .order("display_name");

  if (error) throw error;
  return data ?? [];
}

// ============================================================
// Realtime subscription
// ============================================================

export type TaskChangePayload = RealtimePostgresChangesPayload<Task>;

export function subscribeToTasks(
  callback: (payload: TaskChangePayload) => void
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel("tasks-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks" },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

import { createClient } from "@/lib/supabase/client";
import type { Project, Profile, ProjectMember } from "@/types/database";
import { createChannel } from "@/lib/chat";

// ============================================================
// Types
// ============================================================

export interface ProjectWithStats extends Project {
  task_count: number;
  completed_count: number;
  member_count: number;
  completion_rate: number;
}

export type KpiTimeframe = "short" | "medium" | "long";

export interface KpiGoal {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  timeframe: KpiTimeframe;
  target_value: number;
  current_value: number;
  unit: string;
  due_date: string | null;
  is_completed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Project CRUD
// ============================================================

/** Fetch all projects with computed stats (task counts, members, completion rate) */
export async function fetchProjectsWithStats(): Promise<ProjectWithStats[]> {
  const supabase = createClient();

  // 1. Fetch all projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (projectsError) throw projectsError;
  if (!projects || projects.length === 0) return [];

  // 2. Fetch all tasks with relevant fields
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, project_id, status, assignee_id");

  if (tasksError) throw tasksError;

  // 3. Compute stats per project in JavaScript
  const tasksByProject = new Map<
    string,
    { task_count: number; completed_count: number; assigneeIds: Set<string> }
  >();

  for (const task of tasks ?? []) {
    if (!task.project_id) continue;

    let entry = tasksByProject.get(task.project_id);
    if (!entry) {
      entry = { task_count: 0, completed_count: 0, assigneeIds: new Set() };
      tasksByProject.set(task.project_id, entry);
    }

    entry.task_count++;
    if (task.status === "done") {
      entry.completed_count++;
    }
    if (task.assignee_id) {
      entry.assigneeIds.add(task.assignee_id);
    }
  }

  return projects.map((project) => {
    const stats = tasksByProject.get(project.id);
    const task_count = stats?.task_count ?? 0;
    const completed_count = stats?.completed_count ?? 0;
    const member_count = stats?.assigneeIds.size ?? 0;
    const completion_rate = task_count > 0 ? Math.round((completed_count / task_count) * 100) : 0;

    return {
      ...project,
      task_count,
      completed_count,
      member_count,
      completion_rate,
    };
  });
}

/** Fetch a single project with computed stats */
export async function fetchProject(projectId: string): Promise<ProjectWithStats | null> {
  const supabase = createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError) {
    if (projectError.code === "PGRST116") return null; // Not found
    throw projectError;
  }

  // Fetch tasks for this project
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, status, assignee_id")
    .eq("project_id", projectId);

  if (tasksError) throw tasksError;

  const task_count = tasks?.length ?? 0;
  const completed_count = tasks?.filter((t) => t.status === "done").length ?? 0;
  const assigneeIds = new Set(
    (tasks ?? []).map((t) => t.assignee_id).filter((id): id is string => id !== null)
  );
  const member_count = assigneeIds.size;
  const completion_rate = task_count > 0 ? Math.round((completed_count / task_count) * 100) : 0;

  return {
    ...project,
    task_count,
    completed_count,
    member_count,
    completion_rate,
  };
}

/** Create a new project (auto-creates a linked channel) */
export async function createProject(name: string, description?: string): Promise<Project> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Create linked channel
  const channel = await createChannel(name, description ?? "", "private");

  // 2. Create project with channel_id
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      description: description ?? null,
      created_by: user.id,
      channel_id: channel.id,
    })
    .select()
    .single();

  if (error) throw error;

  // 3. Link channel back to project
  await supabase
    .from("channels")
    .update({ project_id: data.id })
    .eq("id", channel.id);

  // 4. Add creator as project member (leader)
  await addProjectMember(data.id, user.id, ["リーダー"]);

  return data;
}

/** Update an existing project */
export async function updateProject(
  id: string,
  data: { name?: string; description?: string }
): Promise<Project> {
  const supabase = createClient();

  const { data: updated, error } = await supabase
    .from("projects")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/** Delete a project (cascade deletes tasks, also deletes linked channel) */
export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient();

  // Fetch channel_id before deleting
  const { data: project } = await supabase
    .from("projects")
    .select("channel_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;

  // Delete linked channel
  if (project?.channel_id) {
    await supabase.from("channels").delete().eq("id", project.channel_id);
  }
}

// ============================================================
// Project Members
// ============================================================

export interface ProjectMemberWithProfile extends ProjectMember {
  profile: Pick<Profile, "id" | "display_name" | "avatar_url">;
}

/** Fetch all members of a project with their profiles */
export async function fetchProjectMembers(projectId: string): Promise<ProjectMemberWithProfile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("project_members")
    .select("*, profile:profiles!project_members_user_id_fkey(id, display_name, avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    profile: row.profile as Pick<Profile, "id" | "display_name" | "avatar_url">,
  }));
}

/** Add a member to a project */
export async function addProjectMember(
  projectId: string,
  userId: string,
  roles: string[] = []
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    roles,
  });

  if (error) throw error;
}

/** Update a member's roles */
export async function updateProjectMemberRoles(
  memberId: string,
  roles: string[]
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("project_members")
    .update({ roles, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) throw error;
}

/** Remove a member from a project */
export async function removeProjectMember(memberId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("id", memberId);

  if (error) throw error;
}

// ============================================================
// KPI Goals CRUD
// ============================================================

/** Fetch KPI goals for a project, ordered by timeframe then created_at */
export async function fetchKpiGoals(projectId: string): Promise<KpiGoal[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("kpi_goals")
    .select("*")
    .eq("project_id", projectId)
    .order("timeframe", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Create a new KPI goal */
export async function createKpiGoal(
  input: Omit<KpiGoal, "id" | "created_by" | "created_at" | "updated_at" | "is_completed">
): Promise<KpiGoal> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("kpi_goals")
    .insert({
      ...input,
      is_completed: false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update an existing KPI goal */
export async function updateKpiGoal(
  id: string,
  data: Partial<
    Pick<KpiGoal, "title" | "description" | "target_value" | "current_value" | "unit" | "due_date" | "is_completed">
  >
): Promise<KpiGoal> {
  const supabase = createClient();

  const { data: updated, error } = await supabase
    .from("kpi_goals")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/** Delete a KPI goal */
export async function deleteKpiGoal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("kpi_goals").delete().eq("id", id);
  if (error) throw error;
}

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import TaskFilters, { defaultFilters, type FilterState } from "@/components/tasks/TaskFilters";
import TaskCreateModal, { type TaskCreateFormData } from "@/components/tasks/TaskCreateModal";
import { Button } from "@/components/ui";
import type { TaskCardData } from "@/components/tasks/TaskCard";
import type { TaskStatus, TaskPriority } from "@/types/database";
import {
  fetchTasks,
  fetchMembers,
  fetchChannels,
  updateTaskStatus,
  createTask,
  deleteTask,
  subscribeToTasks,
  type TaskChangePayload,
} from "@/lib/tasks";

const priorityWeight: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [members, setMembers] = useState<{ id: string; display_name: string }[]>([]);
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load tasks and members
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [tasksData, membersData, channelsData] = await Promise.all([
          fetchTasks(),
          fetchMembers(),
          fetchChannels(),
        ]);
        if (!cancelled) {
          setTasks(tasksData);
          setMembers(membersData);
          setChannels(channelsData);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load tasks");
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToTasks((payload: TaskChangePayload) => {
      if (payload.eventType === "INSERT") {
        // Re-fetch to get joined data (assignee, labels, subtasks)
        fetchTasks().then(setTasks).catch(console.error);
      } else if (payload.eventType === "UPDATE") {
        fetchTasks().then(setTasks).catch(console.error);
      } else if (payload.eventType === "DELETE" && payload.old) {
        const oldRecord = payload.old as { id?: string };
        if (oldRecord.id) {
          setTasks((prev) => prev.filter((t) => t.id !== oldRecord.id));
        }
      }
    });

    return unsubscribe;
  }, []);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      // Revert on error
      console.error("Failed to update task status:", err);
      const data = await fetchTasks();
      setTasks(data);
    }
  }, []);

  const handleCreateTask = useCallback(async (formData: TaskCreateFormData) => {
    await createTask({
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      assignee_ids: formData.assignee_ids,
      channel_id: formData.channel_id,
      due_date: formData.due_date,
    });
    const data = await fetchTasks();
    setTasks(data);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error("Failed to delete task:", err);
      const data = await fetchTasks();
      setTasks(data);
    }
  }, []);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filters.status !== "all") {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.priority !== "all") {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters.assignee !== "all") {
      result = result.filter((t) => t.assignee_id === filters.assignee);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    switch (filters.sort) {
      case "oldest":
        result = [...result].sort((a, b) => a.created_at.localeCompare(b.created_at));
        break;
      case "newest":
        result = [...result].sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case "due_date":
        result = [...result].sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        });
        break;
      case "priority":
        result = [...result].sort(
          (a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]
        );
        break;
    }

    return result;
  }, [tasks, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        <p className="text-sm">タスクを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-status-overdue">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-3 sm:p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">タスクボード</h1>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          + タスク追加
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onChange={setFilters}
        assigneeOptions={members}
      />

      {/* Kanban */}
      <div className="flex-1 min-h-0">
        <KanbanBoard tasks={filteredTasks} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} />
      </div>

      <TaskCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
        members={members}
        channels={channels}
      />
    </div>
  );
}

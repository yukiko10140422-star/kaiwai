"use client";

import type { TaskStatus, TaskPriority } from "@/types/database";

export interface FilterState {
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  assignee: string | "all"; // user id or "all"
  search: string;
  sort: "newest" | "oldest" | "due_date" | "priority";
}

interface TaskFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  assigneeOptions: { id: string; display_name: string }[];
}

export const defaultFilters: FilterState = {
  status: "all",
  priority: "all",
  assignee: "all",
  search: "",
  sort: "newest",
};

export default function TaskFilters({ filters, onChange, assigneeOptions }: TaskFiltersProps) {
  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <input
        type="text"
        placeholder="タスクを検索..."
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="h-9 rounded-lg border border-border bg-transparent px-3 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors w-48"
      />

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => update({ status: e.target.value as TaskStatus | "all" })}
        className="h-9 rounded-lg border border-border bg-transparent px-2 text-sm focus:outline-none focus:border-accent transition-colors"
      >
        <option value="all">全ステータス</option>
        <option value="todo">未着手</option>
        <option value="in_progress">進行中</option>
        <option value="review">レビュー</option>
        <option value="done">完了</option>
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => update({ priority: e.target.value as TaskPriority | "all" })}
        className="h-9 rounded-lg border border-border bg-transparent px-2 text-sm focus:outline-none focus:border-accent transition-colors"
      >
        <option value="all">全優先度</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>

      {/* Assignee filter */}
      <select
        value={filters.assignee}
        onChange={(e) => update({ assignee: e.target.value })}
        className="h-9 rounded-lg border border-border bg-transparent px-2 text-sm focus:outline-none focus:border-accent transition-colors"
      >
        <option value="all">全メンバー</option>
        {assigneeOptions.map((u) => (
          <option key={u.id} value={u.id}>
            {u.display_name}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={filters.sort}
        onChange={(e) => update({ sort: e.target.value as FilterState["sort"] })}
        className="h-9 rounded-lg border border-border bg-transparent px-2 text-sm focus:outline-none focus:border-accent transition-colors"
      >
        <option value="newest">新しい順</option>
        <option value="oldest">古い順</option>
        <option value="due_date">期限順</option>
        <option value="priority">優先度順</option>
      </select>
    </div>
  );
}

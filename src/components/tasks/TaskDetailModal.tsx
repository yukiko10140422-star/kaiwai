"use client";

import { Modal, Avatar, Badge } from "@/components/ui";
import type { TaskCardData } from "./TaskCard";
import type { TaskStatus, TaskPriority } from "@/types/database";

interface TaskDetailModalProps {
  task: TaskCardData | null;
  onClose: () => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const statusOptions: { value: TaskStatus; label: string; variant: "todo" | "progress" | "review" | "done" }[] = [
  { value: "todo", label: "未着手", variant: "todo" },
  { value: "in_progress", label: "進行中", variant: "progress" },
  { value: "review", label: "レビュー", variant: "review" },
  { value: "done", label: "完了", variant: "done" },
];

const priorityLabels: Record<TaskPriority, { label: string; color: string }> = {
  high: { label: "高", color: "text-red-500" },
  medium: { label: "中", color: "text-amber-500" },
  low: { label: "低", color: "text-gray-500" },
};

export default function TaskDetailModal({ task, onClose, onStatusChange }: TaskDetailModalProps) {
  if (!task) return null;

  const isOverdue =
    task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  const priority = priorityLabels[task.priority];

  return (
    <Modal open={!!task} onClose={onClose} title={task.title} className="max-w-lg">
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Status selector */}
      <div className="mb-4">
        <label className="text-xs text-muted block mb-1.5">ステータス</label>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusChange?.(task.id, opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                task.status === opt.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border hover:bg-card"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Priority */}
        <div>
          <label className="text-xs text-muted block mb-1">優先度</label>
          <span className={`text-sm font-medium ${priority.color}`}>
            {priority.label}
          </span>
        </div>

        {/* Due date */}
        <div>
          <label className="text-xs text-muted block mb-1">期限</label>
          {task.due_date ? (
            <Badge variant={isOverdue ? "overdue" : "default"}>
              {new Date(task.due_date).toLocaleDateString("ja-JP")}
            </Badge>
          ) : (
            <span className="text-sm text-muted">未設定</span>
          )}
        </div>

        {/* Assignee */}
        <div>
          <label className="text-xs text-muted block mb-1">担当者</label>
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <Avatar
                name={task.assignee.display_name}
                src={task.assignee.avatar_url}
                size="sm"
              />
              <span className="text-sm">{task.assignee.display_name}</span>
            </div>
          ) : (
            <span className="text-sm text-muted">未割り当て</span>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <div className="mb-4">
          <label className="text-xs text-muted block mb-1">説明</label>
          <p className="text-sm whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      {/* Subtasks */}
      {task.subtask_total != null && task.subtask_total > 0 && (
        <div className="mb-4">
          <label className="text-xs text-muted block mb-1.5">
            サブタスク ({task.subtask_done ?? 0}/{task.subtask_total})
          </label>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-blue-400 transition-all"
              style={{
                width: `${((task.subtask_done ?? 0) / task.subtask_total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="pt-3 border-t border-border text-[11px] text-muted flex gap-4">
        <span>作成: {new Date(task.created_at).toLocaleDateString("ja-JP")}</span>
        <span>更新: {new Date(task.updated_at).toLocaleDateString("ja-JP")}</span>
      </div>
    </Modal>
  );
}

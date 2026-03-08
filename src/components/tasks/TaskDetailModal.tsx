"use client";

import { Modal, Avatar, Badge } from "@/components/ui";
import type { TaskCardData } from "./TaskCard";
import type { TaskStatus, TaskPriority } from "@/types/database";

interface TaskDetailModalProps {
  task: TaskCardData | null;
  onClose: () => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
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

export default function TaskDetailModal({ task, onClose, onStatusChange, onDelete }: TaskDetailModalProps) {
  const isOverdue =
    task && task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  const priority = task ? priorityLabels[task.priority] : null;

  return (
    <Modal open={!!task} onClose={onClose} title={task?.title ?? ""} className="max-w-lg">
      {task && (
        <>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Priority */}
            <div>
              <label className="text-xs text-muted block mb-1">優先度</label>
              <span className={`text-sm font-medium ${priority?.color}`}>
                {priority?.label}
              </span>
            </div>

            {/* Due date & time */}
            <div>
              <label className="text-xs text-muted block mb-1">期限</label>
              {task.due_date ? (
                <Badge variant={isOverdue ? "overdue" : "default"}>
                  {new Date(task.due_date).toLocaleDateString("ja-JP")}
                  {task.due_time ? ` ${task.due_time.slice(0, 5)}` : ""}
                </Badge>
              ) : task.due_time ? (
                <span className="text-sm">{task.due_time.slice(0, 5)}</span>
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

          {/* Location */}
          {task.location && (
            <div className="mb-4">
              <label className="text-xs text-muted block mb-1">場所</label>
              <div className="flex items-center gap-1.5 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {task.location}
                </a>
              </div>
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(task.location)}&output=embed`}
                className="w-full h-40 rounded-lg border border-border mt-2"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Google Mapsで開く
              </a>
            </div>
          )}

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

          {/* Timestamps & Delete */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="text-[11px] text-muted flex gap-4">
              <span>作成: {new Date(task.created_at).toLocaleDateString("ja-JP")}</span>
              <span>更新: {new Date(task.updated_at).toLocaleDateString("ja-JP")}</span>
            </div>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm("このタスクを削除しますか？")) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="text-xs text-status-overdue hover:text-red-400 transition-colors"
              >
                削除
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

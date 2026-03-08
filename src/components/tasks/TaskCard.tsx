"use client";


import { Avatar, Badge } from "@/components/ui";
import type { Task, TaskStatus, TaskPriority, Label, Profile } from "@/types/database";

const statusBadgeVariant: Record<TaskStatus, "todo" | "progress" | "review" | "done"> = {
  todo: "todo",
  in_progress: "progress",
  review: "review",
  done: "done",
};

const statusLabel: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  review: "レビュー",
  done: "完了",
};

const priorityIcon: Record<TaskPriority, { color: string; label: string }> = {
  high: { color: "text-red-500", label: "高" },
  medium: { color: "text-amber-500", label: "中" },
  low: { color: "text-gray-500", label: "低" },
};

export interface TaskCardData extends Task {
  assignee?: Pick<Profile, "display_name" | "avatar_url"> | null;
  assignees?: Pick<Profile, "id" | "display_name" | "avatar_url">[];
  channel?: Pick<import("@/types/database").Channel, "id" | "name"> | null;
  labels?: Label[];
  subtask_total?: number;
  subtask_done?: number;
}

interface TaskCardProps {
  task: TaskCardData;
  onClick: (task: TaskCardData) => void;
  isDragging?: boolean;
}

export default function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const isOverdue =
    task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  const priority = priorityIcon[task.priority];

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
      }}
      onClick={() => onClick(task)}
      className={`glass gradient-border rounded-xl p-4 cursor-pointer select-none transition-all hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-0.5 active:scale-[0.98] ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h3 className="text-sm font-semibold mb-2 line-clamp-2">{task.title}</h3>

      {/* Subtask progress */}
      {task.subtask_total != null && task.subtask_total > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{
                width: `${((task.subtask_done ?? 0) / task.subtask_total) * 100}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-muted">
            {task.subtask_done ?? 0}/{task.subtask_total}
          </span>
        </div>
      )}

      {/* Location */}
      {task.location && (
        <div className="flex items-center gap-1 text-[11px] text-muted mt-1 mb-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{task.location}</span>
        </div>
      )}

      {/* Footer: priority, due date, assignee */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <span className={`text-xs font-medium ${priority.color}`} title={`優先度: ${priority.label}`}>
            <PriorityIcon priority={task.priority} />
          </span>

          {/* Due date & time */}
          {task.due_date && (
            <Badge variant={isOverdue ? "overdue" : "default"}>
              {formatDate(task.due_date)}
              {task.due_time ? ` ${task.due_time.slice(0, 5)}` : ""}
            </Badge>
          )}
        </div>

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((a) => (
              <Avatar
                key={a.id}
                name={a.display_name}
                src={a.avatar_url}
                size="xs"
              />
            ))}
            {task.assignees.length > 3 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-card text-[9px] text-muted border border-border">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>
        ) : task.assignee ? (
          <Avatar
            name={task.assignee.display_name}
            src={task.assignee.avatar_url}
            size="xs"
          />
        ) : null}
      </div>
    </div>
  );
}

function PriorityIcon({ priority }: { priority: TaskPriority }) {
  const colors: Record<TaskPriority, string> = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#6b7280",
  };
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors[priority]} strokeWidth="2.5">
      {priority === "high" && (
        <>
          <path strokeLinecap="round" d="M12 3v12" />
          <path strokeLinecap="round" d="M8 7l4-4 4 4" />
          <circle cx="12" cy="20" r="1" fill={colors[priority]} />
        </>
      )}
      {priority === "medium" && (
        <path strokeLinecap="round" d="M5 12h14" />
      )}
      {priority === "low" && (
        <>
          <path strokeLinecap="round" d="M12 21V9" />
          <path strokeLinecap="round" d="M8 17l4 4 4-4" />
        </>
      )}
    </svg>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

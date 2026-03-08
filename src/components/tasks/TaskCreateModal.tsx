"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import type { TaskStatus, TaskPriority } from "@/types/database";
import { showToast } from "@/lib/toast";

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskCreateFormData) => Promise<void>;
  members: { id: string; display_name: string }[];
  channels: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}

export interface TaskCreateFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_ids: string[];
  channel_id: string | null;
  project_id: string | null;
  due_date: string | null;
  due_time: string | null;
  location: string | null;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "review", label: "レビュー" },
  { value: "done", label: "完了" },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

export default function TaskCreateModal({ open, onClose, onSubmit, members, channels, projects }: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [channelId, setChannelId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setAssigneeIds([]);
    setChannelId("");
    setProjectId("");
    setDueDate("");
    setDueTime("");
    setLocation("");
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description,
        status,
        priority,
        assignee_ids: assigneeIds,
        channel_id: channelId || null,
        project_id: projectId || null,
        due_date: dueDate || null,
        due_time: dueTime || null,
        location: location.trim() || null,
      });
      resetForm();
      onClose();
    } catch (err) {
      console.error("Failed to create task:", err);
      showToast("タスクの作成に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="タスク追加" className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <label htmlFor="task-title" className="block text-xs text-muted mb-1">
            タスク名 *
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            placeholder="タスク名を入力"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="task-desc" className="block text-xs text-muted mb-1">
            説明
          </label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none min-h-[44px]"
            placeholder="タスクの説明（任意）"
          />
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-status" className="block text-xs text-muted mb-1">
              ステータス
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-priority" className="block text-xs text-muted mb-1">
              優先度
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignees (multi-select) */}
        <div>
          <label className="block text-xs text-muted mb-1">
            担当者（複数選択可）
          </label>
          <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border bg-background min-h-[38px]">
            {members.length === 0 ? (
              <span className="text-xs text-muted">メンバーがいません</span>
            ) : (
              members.map((m) => {
                const selected = assigneeIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleAssignee(m.id)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "bg-accent text-white"
                        : "bg-card text-muted hover:bg-border"
                    }`}
                  >
                    {m.display_name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Project & Channel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-project" className="block text-xs text-muted mb-1">
              プロジェクト
            </label>
            <select
              id="task-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            >
              <option value="">なし</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-channel" className="block text-xs text-muted mb-1">
              チャンネル
            </label>
            <select
              id="task-channel"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            >
              <option value="">なし</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>#{ch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Due date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-due" className="block text-xs text-muted mb-1">
              期限
            </label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="task-time" className="block text-xs text-muted mb-1">
              時間
            </label>
            <input
              id="task-time"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="task-location" className="block text-xs text-muted mb-1">
            場所
          </label>
          <input
            id="task-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            placeholder="例: 会議室A、Zoom"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            キャンセル
          </Button>
          <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
            {submitting ? "作成中..." : "作成"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

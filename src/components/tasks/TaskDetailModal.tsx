"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, Avatar, Badge, Button } from "@/components/ui";
import LocationInput from "./LocationInput";
import type { TaskCardData } from "./TaskCard";
import type { TaskStatus, TaskPriority, TaskComment, Profile } from "@/types/database";
import type { UpdateTaskInput } from "@/lib/tasks";
import { setTaskAssignees, fetchTaskComments, createTaskComment } from "@/lib/tasks";

type CommentWithAuthor = TaskComment & { author: Pick<Profile, "display_name" | "avatar_url"> };

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

interface TaskDetailModalProps {
  task: TaskCardData | null;
  onClose: () => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  onUpdate?: (taskId: string, input: UpdateTaskInput) => Promise<void>;
  members?: { id: string; display_name: string }[];
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

export default function TaskDetailModal({ task, onClose, onStatusChange, onDelete, onUpdate, members = [] }: TaskDetailModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [location, setLocation] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  // Sync form state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setDueDate(task.due_date ?? "");
      setDueTime(task.due_time ? task.due_time.slice(0, 5) : "");
      setLocation(task.location ?? "");
      setAssigneeIds(task.assignees ? task.assignees.map((a) => a.id) : task.assignee_id ? [task.assignee_id] : []);
      setEditMode(false);
    }
  }, [task]);

  // Fetch comments when task changes
  const loadComments = useCallback(async (taskId: string) => {
    setLoadingComments(true);
    try {
      const data = await fetchTaskComments(taskId);
      setComments(data);
    } catch (e) {
      console.error("Failed to fetch comments:", e);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    if (task?.id) {
      loadComments(task.id);
      setCommentText("");
    } else {
      setComments([]);
    }
  }, [task?.id, loadComments]);

  const handleAddComment = async () => {
    if (!task || !commentText.trim()) return;
    try {
      await createTaskComment(task.id, commentText.trim());
      setCommentText("");
      await loadComments(task.id);
    } catch (e) {
      console.error("Failed to add comment:", e);
    }
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!task || !onUpdate || !title.trim()) return;
    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        due_time: dueTime || null,
        location: location.trim() || null,
      });
      await setTaskAssignees(task.id, assigneeIds);
      setEditMode(false);
    } catch (e) {
      console.error("Failed to update task:", e);
    } finally {
      setSaving(false);
    }
  };

  const isOverdue =
    task && task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  const priorityInfo = task ? priorityLabels[task.priority] : null;

  return (
    <Modal open={!!task} onClose={onClose} title={editMode ? "タスク編集" : (task?.title ?? "")} className="max-w-lg">
      {task && (
        <>
          {editMode ? (
            /* ===== Edit Mode ===== */
            <div className="flex flex-col gap-3">
              {/* Title */}
              <div>
                <label className="block text-xs text-muted mb-1">タスク名 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-muted mb-1">説明</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none min-h-[44px]"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs text-muted mb-1">優先度</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>

              {/* Due date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">期限</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">時間</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
              </div>

              {/* Location with Google Maps preview */}
              <LocationInput value={location} onChange={setLocation} id="edit-task-location" />

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

              {/* Save/Cancel */}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                  キャンセル
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          ) : (
            /* ===== View Mode ===== */
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
                  <span className={`text-sm font-medium ${priorityInfo?.color}`}>
                    {priorityInfo?.label}
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

              {/* Timestamps, Edit & Delete */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="text-[11px] text-muted flex gap-4">
                  <span>作成: {new Date(task.created_at).toLocaleDateString("ja-JP")}</span>
                  <span>更新: {new Date(task.updated_at).toLocaleDateString("ja-JP")}</span>
                </div>
                <div className="flex items-center gap-3">
                  {onUpdate && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-xs text-accent hover:text-accent-hover transition-colors"
                    >
                      編集
                    </button>
                  )}
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
              </div>

              {/* Comments Section */}
              <div className="pt-3 border-t border-border mt-4">
                <h4 className="text-xs text-muted mb-3">コメント ({comments.length})</h4>

                {/* Comment list */}
                <div className="flex flex-col gap-3 mb-3 max-h-48 overflow-y-auto">
                  {loadingComments ? (
                    <p className="text-xs text-muted">読み込み中...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-muted">コメントはまだありません</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <Avatar name={c.author.display_name} src={c.author.avatar_url} size="xs" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{c.author.display_name}</span>
                            <span className="text-[10px] text-muted">{relativeTime(c.created_at)}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="コメントを入力..."
                    rows={2}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none min-h-[44px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="self-end rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    送信
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

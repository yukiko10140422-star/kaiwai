"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, Avatar, Badge, Button } from "@/components/ui";
import LocationInput from "./LocationInput";
import type { TaskCardData } from "./TaskCard";
import type { TaskStatus, TaskPriority, TaskComment, Profile } from "@/types/database";
import type { UpdateTaskInput } from "@/lib/tasks";
import { setTaskAssignees, fetchTaskComments, createTaskComment } from "@/lib/tasks";
import { generateGoogleCalendarUrl, generateIcsContent, downloadIcs } from "@/lib/calendar-export";
import {
  fetchTaskSubmissions,
  createSubmission,
  reviewSubmission,
  deleteSubmission,
  getSubmissionFileUrl,
  type SubmissionWithAuthor,
} from "@/lib/submissions";

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

  // Submissions
  const [submissions, setSubmissions] = useState<SubmissionWithAuthor[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submitFiles, setSubmitFiles] = useState<File[]>([]);
  const [submitComment, setSubmitComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

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

  // Submissions
  const loadSubmissions = useCallback(async (taskId: string) => {
    setLoadingSubmissions(true);
    try {
      const data = await fetchTaskSubmissions(taskId);
      setSubmissions(data);
    } catch (e) {
      console.error("Failed to fetch submissions:", e);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    if (task?.id) {
      loadSubmissions(task.id);
      setSubmitFiles([]);
      setSubmitComment("");
      setReviewingId(null);
    } else {
      setSubmissions([]);
    }
  }, [task?.id, loadSubmissions]);

  const handleSubmit = async () => {
    if (!task || submitFiles.length === 0) return;
    setSubmitting(true);
    try {
      await createSubmission(task.id, submitFiles, submitComment);
      setSubmitFiles([]);
      setSubmitComment("");
      await loadSubmissions(task.id);
    } catch (e) {
      console.error("Failed to submit:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (submissionId: string, status: "approved" | "rejected") => {
    try {
      await reviewSubmission(submissionId, status, reviewNotes);
      setReviewingId(null);
      setReviewNotes("");
      if (task) await loadSubmissions(task.id);
    } catch (e) {
      console.error("Failed to review:", e);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      await deleteSubmission(submissionId);
      if (task) await loadSubmissions(task.id);
    } catch (e) {
      console.error("Failed to delete submission:", e);
    }
  };

  const handleFileDownload = async (storagePath: string, fileName: string) => {
    const url = await getSubmissionFileUrl(storagePath);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.target = "_blank";
      a.click();
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

                {/* Calendar export */}
                {task.due_date && (
                  <div className="col-span-1 sm:col-span-3 flex items-center gap-3">
                    <a
                      href={generateGoogleCalendarUrl(task) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent hover:underline flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Googleカレンダーに追加
                    </a>
                    <button
                      onClick={() => {
                        const ics = generateIcsContent(task);
                        if (ics) downloadIcs(`${task.title}.ics`, ics);
                      }}
                      className="text-[11px] text-muted hover:text-foreground flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      .icsダウンロード
                    </button>
                  </div>
                )}

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

              {/* Submissions Section (成果物提出) */}
              <div className="pt-3 border-t border-border mt-4">
                <h4 className="text-xs text-muted mb-3">
                  成果物 ({submissions.length})
                  {submissions.some((s) => s.status === "pending") && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                      {submissions.filter((s) => s.status === "pending").length} 件未レビュー
                    </span>
                  )}
                </h4>

                {/* Submission list */}
                <div className="space-y-3 mb-3">
                  {loadingSubmissions ? (
                    <p className="text-xs text-muted">読み込み中...</p>
                  ) : submissions.length === 0 ? (
                    <p className="text-xs text-muted">提出はまだありません</p>
                  ) : (
                    submissions.map((s) => (
                      <div key={s.id} className={`rounded-lg border p-3 ${
                        s.status === "approved" ? "border-green-500/30 bg-green-500/5" :
                        s.status === "rejected" ? "border-red-500/30 bg-red-500/5" :
                        "border-border bg-card/30"
                      }`}>
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar src={s.author.avatar_url} name={s.author.display_name} size="xs" />
                          <span className="text-xs font-medium">{s.author.display_name}</span>
                          <span className="text-[10px] text-muted">{relativeTime(s.created_at)}</span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.status === "approved" ? "bg-green-500/20 text-green-400" :
                            s.status === "rejected" ? "bg-red-500/20 text-red-400" :
                            "bg-amber-500/20 text-amber-400"
                          }`}>
                            {s.status === "approved" ? "承認済み" : s.status === "rejected" ? "差し戻し" : "レビュー待ち"}
                          </span>
                        </div>

                        {/* Comment */}
                        {s.comment && (
                          <p className="text-sm mb-2">{s.comment}</p>
                        )}

                        {/* Files */}
                        {s.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {s.files.map((f) => (
                              <button
                                key={f.id}
                                onClick={() => handleFileDownload(f.storage_path, f.file_name)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded border border-border hover:border-accent/50 text-xs transition-colors"
                              >
                                <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                </svg>
                                <span className="truncate max-w-[120px]">{f.file_name}</span>
                                <span className="text-muted text-[10px]">
                                  {f.file_size < 1024 * 1024
                                    ? `${(f.file_size / 1024).toFixed(0)}KB`
                                    : `${(f.file_size / (1024 * 1024)).toFixed(1)}MB`}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Reviewer notes */}
                        {s.reviewer_notes && (
                          <div className="text-xs mt-2 p-2 rounded bg-background/50 border border-border/50">
                            <span className="font-medium">レビュー: </span>
                            {s.reviewer_notes}
                            {s.reviewer && (
                              <span className="text-muted ml-1">— {s.reviewer.display_name}</span>
                            )}
                          </div>
                        )}

                        {/* Review actions */}
                        {s.status === "pending" && (
                          <div className="mt-2">
                            {reviewingId === s.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="レビューコメント（任意）..."
                                  rows={2}
                                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReview(s.id, "approved")}
                                    className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors"
                                  >
                                    承認
                                  </button>
                                  <button
                                    onClick={() => handleReview(s.id, "rejected")}
                                    className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                                  >
                                    差し戻し
                                  </button>
                                  <button
                                    onClick={() => { setReviewingId(null); setReviewNotes(""); }}
                                    className="px-3 py-1 rounded-lg text-muted text-xs hover:text-foreground transition-colors"
                                  >
                                    キャンセル
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setReviewingId(s.id)}
                                  className="px-2 py-1 rounded text-xs text-accent hover:underline"
                                >
                                  レビューする
                                </button>
                                <button
                                  onClick={() => handleDeleteSubmission(s.id)}
                                  className="px-2 py-1 rounded text-xs text-muted hover:text-status-overdue"
                                >
                                  削除
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Submit new deliverable */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-accent/50 text-xs text-muted hover:text-foreground cursor-pointer transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                      ファイルを選択
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            setSubmitFiles(Array.from(e.target.files));
                          }
                        }}
                      />
                    </label>
                    {submitFiles.length > 0 && (
                      <span className="text-xs text-muted">
                        {submitFiles.length} ファイル選択中
                      </span>
                    )}
                  </div>

                  {submitFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {submitFiles.map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-card border border-border text-[11px]">
                          {f.name}
                          <button
                            onClick={() => setSubmitFiles((prev) => prev.filter((_, j) => j !== i))}
                            className="text-muted hover:text-foreground"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {submitFiles.length > 0 && (
                    <div className="flex gap-2">
                      <textarea
                        value={submitComment}
                        onChange={(e) => setSubmitComment(e.target.value)}
                        placeholder="提出コメント（任意）..."
                        rows={1}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none min-h-[36px]"
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="self-end rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
                      >
                        {submitting ? "提出中..." : "提出"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

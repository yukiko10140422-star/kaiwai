"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Input, Modal } from "@/components/ui";
import PageTransition from "@/components/ui/PageTransition";
import {
  fetchProjectsWithStats,
  createProject,
  deleteProject,
  type ProjectWithStats,
} from "@/lib/projects";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjectsWithStats();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "プロジェクトの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setCreateError(null);

    try {
      await createProject(newName.trim(), newDescription.trim() || undefined);
      setShowCreateModal(false);
      setNewName("");
      setNewDescription("");
      await loadProjects();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    setDeleting(true);
    try {
      await deleteProject(deleteTargetId);
      setDeleteTargetId(null);
      await loadProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
      setDeleteTargetId(null);
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        <p className="text-sm">プロジェクトを読み込み中...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-status-overdue">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <PageTransition className="flex flex-col h-full p-3 sm:p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text">
          プロジェクト管理
        </h1>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          + 新規プロジェクト
        </Button>
      </div>

      {/* Project cards grid */}
      {projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted gap-3">
          <svg
            className="w-16 h-16 opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <p className="text-sm">プロジェクトがありません</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            variant="secondary"
          >
            最初のプロジェクトを作成
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass rounded-2xl p-5 hover-lift flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="flex-1 min-w-0"
                >
                  <h3 className="font-bold text-base truncate hover:text-accent transition-colors">
                    {project.name}
                  </h3>
                </Link>
                <button
                  onClick={() => setDeleteTargetId(project.id)}
                  className="text-muted hover:text-status-overdue transition-colors shrink-0 p-1"
                  aria-label="プロジェクトを削除"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {project.description && (
                <p className="text-sm text-muted line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-muted">
                <span>
                  タスク数:{" "}
                  <span className="text-foreground font-medium">
                    {project.task_count}
                  </span>
                </span>
                <span>
                  完了数:{" "}
                  <span className="text-foreground font-medium">
                    {project.completed_count}
                  </span>
                </span>
                <span>
                  完了率:{" "}
                  <span className="text-foreground font-medium">
                    {project.completion_rate}%
                  </span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${project.completion_rate}%` }}
                />
              </div>

              {/* Link to detail */}
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="text-xs text-accent hover:underline mt-auto self-end"
              >
                詳細を見る →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create project modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewName("");
          setNewDescription("");
          setCreateError(null);
        }}
        title="新規プロジェクト"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="project-name"
            label="プロジェクト名"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="プロジェクト名を入力"
            required
            autoFocus
          />

          <div className="flex flex-col gap-1">
            <label
              htmlFor="project-description"
              className="block text-sm font-medium"
            >
              説明（任意）
            </label>
            <textarea
              id="project-description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="プロジェクトの説明を入力"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {createError && (
            <p className="text-sm text-status-overdue">{createError}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowCreateModal(false);
                setNewName("");
                setNewDescription("");
                setCreateError(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={creating || !newName.trim()}
            >
              {creating ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        title="プロジェクトの削除"
      >
        <p className="text-sm text-muted mb-4">
          このプロジェクトを削除しますか？関連するタスクもすべて削除されます。この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeleteTargetId(null)}
          >
            キャンセル
          </Button>
          <Button
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="!bg-status-overdue hover:!bg-status-overdue/80 !from-status-overdue !to-status-overdue"
          >
            {deleting ? "削除中..." : "削除する"}
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}

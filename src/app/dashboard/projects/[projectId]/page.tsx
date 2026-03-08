"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Modal, Badge } from "@/components/ui";
import PageTransition from "@/components/ui/PageTransition";
import {
  fetchProject,
  updateProject,
  fetchKpiGoals,
  createKpiGoal,
  updateKpiGoal,
  deleteKpiGoal,
  fetchProjectMembers,
  type ProjectWithStats,
  type ProjectMemberWithProfile,
  type KpiGoal,
  type KpiTimeframe,
} from "@/lib/projects";
import { fetchTasks, fetchMembers } from "@/lib/tasks";
import type { TaskCardData } from "@/components/tasks/TaskCard";
import type { Profile } from "@/types/database";
import ProjectMembersSection from "@/components/projects/ProjectMembersSection";

const timeframeConfig: Record<KpiTimeframe, { label: string; color: string; bgColor: string }> = {
  short: { label: "短期目標", color: "text-status-progress", bgColor: "bg-status-progress" },
  medium: { label: "中期目標", color: "text-status-review", bgColor: "bg-status-review" },
  long: { label: "長期目標", color: "text-accent-secondary", bgColor: "bg-accent-secondary" },
};

const statusLabel: Record<string, string> = {
  todo: "未着手",
  in_progress: "進行中",
  review: "レビュー",
  done: "完了",
};

const statusVariant: Record<string, "todo" | "progress" | "review" | "done"> = {
  todo: "todo",
  in_progress: "progress",
  review: "review",
  done: "done",
};

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<ProjectWithStats | null>(null);
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [kpiGoals, setKpiGoals] = useState<KpiGoal[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberWithProfile[]>([]);
  const [allUsers, setAllUsers] = useState<Pick<Profile, "id" | "display_name" | "avatar_url">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit project
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);

  // KPI modal
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiGoal | null>(null);
  const [kpiForm, setKpiForm] = useState({
    title: "",
    description: "",
    timeframe: "short" as KpiTimeframe,
    target_value: 100,
    current_value: 0,
    unit: "%",
    due_date: "",
  });
  const [kpiSubmitting, setKpiSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, t, k, pm, users] = await Promise.all([
        fetchProject(projectId),
        fetchTasks(projectId),
        fetchKpiGoals(projectId).catch(() => [] as KpiGoal[]),
        fetchProjectMembers(projectId).catch(() => [] as ProjectMemberWithProfile[]),
        fetchMembers(),
      ]);
      if (!p) {
        setError("プロジェクトが見つかりません");
        return;
      }
      setProject(p);
      setTasks(t);
      setKpiGoals(k);
      setProjectMembers(pm);
      setAllUsers(users);
      setNameValue(p.name);
      setDescValue(p.description ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reloadMembers = useCallback(async () => {
    try {
      const pm = await fetchProjectMembers(projectId);
      setProjectMembers(pm);
    } catch (e) {
      console.error("Failed to reload members:", e);
    }
  }, [projectId]);

  const handleSaveName = async () => {
    if (!nameValue.trim() || !project) return;
    try {
      await updateProject(project.id, { name: nameValue.trim() });
      setProject((p) => p ? { ...p, name: nameValue.trim() } : p);
      setEditingName(false);
    } catch (e) {
      console.error("Failed to update name:", e);
    }
  };

  const handleSaveDesc = async () => {
    if (!project) return;
    try {
      await updateProject(project.id, { description: descValue.trim() });
      setProject((p) => p ? { ...p, description: descValue.trim() } : p);
      setEditingDesc(false);
    } catch (e) {
      console.error("Failed to update description:", e);
    }
  };

  const openKpiModal = (timeframe: KpiTimeframe, kpi?: KpiGoal) => {
    if (kpi) {
      setEditingKpi(kpi);
      setKpiForm({
        title: kpi.title,
        description: kpi.description ?? "",
        timeframe: kpi.timeframe,
        target_value: kpi.target_value,
        current_value: kpi.current_value,
        unit: kpi.unit,
        due_date: kpi.due_date ?? "",
      });
    } else {
      setEditingKpi(null);
      setKpiForm({
        title: "",
        description: "",
        timeframe,
        target_value: 100,
        current_value: 0,
        unit: "%",
        due_date: "",
      });
    }
    setShowKpiModal(true);
  };

  const handleKpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiForm.title.trim()) return;
    setKpiSubmitting(true);
    try {
      if (editingKpi) {
        await updateKpiGoal(editingKpi.id, {
          title: kpiForm.title.trim(),
          description: kpiForm.description.trim() || null,
          target_value: kpiForm.target_value,
          current_value: kpiForm.current_value,
          unit: kpiForm.unit,
          due_date: kpiForm.due_date || null,
        });
      } else {
        await createKpiGoal({
          project_id: projectId,
          title: kpiForm.title.trim(),
          description: kpiForm.description.trim() || null,
          timeframe: kpiForm.timeframe,
          target_value: kpiForm.target_value,
          current_value: kpiForm.current_value,
          unit: kpiForm.unit,
          due_date: kpiForm.due_date || null,
        });
      }
      setShowKpiModal(false);
      const goals = await fetchKpiGoals(projectId).catch(() => []);
      setKpiGoals(goals);
    } catch (err) {
      console.error("Failed to save KPI:", err);
    } finally {
      setKpiSubmitting(false);
    }
  };

  const handleDeleteKpi = async (id: string) => {
    try {
      await deleteKpiGoal(id);
      setKpiGoals((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error("Failed to delete KPI:", err);
    }
  };

  const handleToggleKpiComplete = async (kpi: KpiGoal) => {
    try {
      await updateKpiGoal(kpi.id, { is_completed: !kpi.is_completed });
      setKpiGoals((prev) =>
        prev.map((k) => (k.id === kpi.id ? { ...k, is_completed: !k.is_completed } : k))
      );
    } catch (err) {
      console.error("Failed to toggle KPI:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        読み込み中…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-status-overdue text-sm">{error ?? "プロジェクトが見つかりません"}</p>
        <Link href="/dashboard/projects">
          <Button variant="secondary" size="sm">← プロジェクト一覧に戻る</Button>
        </Link>
      </div>
    );
  }

  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;

  return (
    <PageTransition className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard/projects"
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              ← プロジェクト一覧
            </Link>
            {project.channel_id && (
              <Link href={`/dashboard/chat/${project.channel_id}`}>
                <Button variant="secondary" size="sm">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    チャット
                  </span>
                </Button>
              </Link>
            )}
          </div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                autoFocus
                className="text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-accent focus:outline-none"
              />
            </div>
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              className="text-xl sm:text-2xl font-bold gradient-text cursor-pointer hover:opacity-80"
            >
              {project.name}
            </h1>
          )}
          {editingDesc ? (
            <div className="mt-1">
              <textarea
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={handleSaveDesc}
                rows={2}
                autoFocus
                className="w-full text-sm text-muted bg-transparent border border-border rounded-lg px-2 py-1 focus:outline-none focus:border-accent resize-none"
              />
            </div>
          ) : (
            <p
              onClick={() => setEditingDesc(true)}
              className="text-sm text-muted mt-1 cursor-pointer hover:text-foreground transition-colors"
            >
              {project.description || "説明を追加..."}
            </p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold">{projectMembers.length}</p>
          <p className="text-xs text-muted">メンバー</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold">{project.task_count}</p>
          <p className="text-xs text-muted">全タスク</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-status-done">{project.completed_count}</p>
          <p className="text-xs text-muted">完了</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-status-progress">{inProgressCount}</p>
          <p className="text-xs text-muted">進行中</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">{project.completion_rate}%</p>
          <p className="text-xs text-muted">完了率</p>
        </div>
      </div>

      {/* KPI Goals */}
      <div>
        <h2 className="font-bold text-lg mb-3">KPI 目標</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["short", "medium", "long"] as KpiTimeframe[]).map((tf) => {
            const config = timeframeConfig[tf];
            const goals = kpiGoals.filter((k) => k.timeframe === tf);
            return (
              <div key={tf} className="glass rounded-2xl p-4">
                <h3 className={`font-semibold text-sm mb-3 ${config.color}`}>
                  {config.label}
                </h3>
                <div className="space-y-3">
                  {goals.map((kpi) => {
                    const progress = kpi.target_value > 0
                      ? Math.min(100, Math.round((kpi.current_value / kpi.target_value) * 100))
                      : 0;
                    return (
                      <div
                        key={kpi.id}
                        className={`p-3 rounded-lg bg-background/50 border border-border/50 ${kpi.is_completed ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <button
                            onClick={() => handleToggleKpiComplete(kpi)}
                            className={`text-sm font-medium text-left flex-1 ${kpi.is_completed ? "line-through text-muted" : ""}`}
                          >
                            {kpi.title}
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openKpiModal(tf, kpi)}
                              className="text-muted hover:text-foreground p-0.5"
                              aria-label="編集"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteKpi(kpi.id)}
                              className="text-muted hover:text-status-overdue p-0.5"
                              aria-label="削除"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted mb-1.5">
                          <span>{kpi.current_value} / {kpi.target_value} {kpi.unit}</span>
                          {kpi.due_date && (
                            <span>期限: {kpi.due_date.slice(5).replace("-", "/")}</span>
                          )}
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${config.bgColor}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {goals.length === 0 && (
                    <p className="text-xs text-muted text-center py-2">目標がありません</p>
                  )}
                </div>
                <button
                  onClick={() => openKpiModal(tf)}
                  className="w-full mt-3 text-xs text-muted hover:text-foreground py-1.5 rounded-lg border border-dashed border-border hover:border-accent/50 transition-colors"
                >
                  + 目標を追加
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Members */}
      <ProjectMembersSection
        projectId={projectId}
        members={projectMembers}
        allUsers={allUsers}
        onUpdate={reloadMembers}
      />

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">タスク一覧</h2>
          <Link href={`/dashboard/tasks?project=${projectId}`}>
            <Button variant="secondary" size="sm">カンバンで見る</Button>
          </Link>
        </div>
        <div className="glass rounded-2xl overflow-hidden">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">タスクがありません</p>
          ) : (
            <div className="divide-y divide-border">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-card/50 transition-colors"
                >
                  <Badge variant={statusVariant[task.status] ?? "todo"}>
                    {statusLabel[task.status] ?? task.status}
                  </Badge>
                  <span className="text-sm flex-1 truncate">{task.title}</span>
                  {task.due_date && (
                    <span className="text-xs text-muted shrink-0">
                      {task.due_date.slice(5).replace("-", "/")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Modal */}
      <Modal
        open={showKpiModal}
        onClose={() => setShowKpiModal(false)}
        title={editingKpi ? "KPI 目標を編集" : "KPI 目標を追加"}
        className="max-w-md"
      >
        <form onSubmit={handleKpiSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">タイトル *</label>
            <input
              value={kpiForm.title}
              onChange={(e) => setKpiForm((f) => ({ ...f, title: e.target.value }))}
              required
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus-glow"
              placeholder="例: 月間売上目標"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">説明</label>
            <textarea
              value={kpiForm.description}
              onChange={(e) => setKpiForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus-glow resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">期間</label>
              <select
                value={kpiForm.timeframe}
                onChange={(e) => setKpiForm((f) => ({ ...f, timeframe: e.target.value as KpiTimeframe }))}
                className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:outline-none focus-glow"
                disabled={!!editingKpi}
              >
                <option value="short">短期</option>
                <option value="medium">中期</option>
                <option value="long">長期</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">目標値</label>
              <input
                type="number"
                value={kpiForm.target_value}
                onChange={(e) => setKpiForm((f) => ({ ...f, target_value: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:outline-none focus-glow"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">現在値</label>
              <input
                type="number"
                value={kpiForm.current_value}
                onChange={(e) => setKpiForm((f) => ({ ...f, current_value: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:outline-none focus-glow"
                min={0}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">単位</label>
              <input
                value={kpiForm.unit}
                onChange={(e) => setKpiForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus-glow"
                placeholder="例: %, 万円, 件"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">期限</label>
              <input
                type="date"
                value={kpiForm.due_date}
                onChange={(e) => setKpiForm((f) => ({ ...f, due_date: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus-glow"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowKpiModal(false)}>
              キャンセル
            </Button>
            <Button type="submit" size="sm" disabled={kpiSubmitting || !kpiForm.title.trim()}>
              {kpiSubmitting ? "保存中..." : editingKpi ? "更新" : "追加"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
}

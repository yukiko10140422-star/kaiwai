"use client";

import { useState, useEffect } from "react";
import {
  ProgressCircle,
  ProgressBar,
  StatCard,
  CalendarView,
  MemberProgress,
} from "@/components/dashboard";
import {
  fetchDashboardStats,
  fetchMemberProgress,
  fetchProjectProgress,
  fetchCalendarTasks,
} from "@/lib/dashboard";
import type {
  DashboardStats,
  MemberStat,
  ProjectProgress,
  CalendarTask,
} from "@/lib/dashboard";

export default function ProgressPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [members, setMembers] = useState<MemberStat[]>([]);
  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, m, p, c] = await Promise.all([
          fetchDashboardStats(),
          fetchMemberProgress(),
          fetchProjectProgress(),
          fetchCalendarTasks(),
        ]);
        setStats(s);
        setMembers(m);
        setProjects(p);
        setCalendarTasks(c);
      } catch (e) {
        setError(e instanceof Error ? e.message : "データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        読み込み中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-status-overdue">
        {error}
      </div>
    );
  }

  const s = stats ?? { total: 0, completed: 0, inProgress: 0, review: 0, overdue: 0 };
  const completionRate = s.total > 0 ? (s.completed / s.total) * 100 : 0;

  const upcomingTasks = calendarTasks.filter((t) => t.status !== "done");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold">進捗ダッシュボード</h1>

      {/* 統計サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="全タスク"
          value={s.total}
          accentColor="var(--accent)"
          icon={<ClipboardIcon />}
        />
        <StatCard
          title="完了"
          value={s.completed}
          accentColor="var(--color-status-done)"
          icon={<CheckIcon />}
        />
        <StatCard
          title="進行中"
          value={s.inProgress}
          accentColor="var(--color-status-progress)"
          icon={<SpinnerIcon />}
        />
        <StatCard
          title="期限切れ"
          value={s.overdue}
          accentColor="var(--color-status-overdue)"
          icon={<AlertIcon />}
        />
      </div>

      {/* メインコンテンツ: 円グラフ + プロジェクト別進捗 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 全体進捗率 */}
        <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="font-semibold mb-4 self-start">全体進捗率</h3>
          <ProgressCircle value={completionRate} size={160} strokeWidth={10} label="完了" />
          <div className="flex gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-done" />
              完了 {s.completed}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-progress" />
              進行中 {s.inProgress}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-review" />
              レビュー {s.review}
            </span>
          </div>
        </div>

        {/* プロジェクト別進捗 */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">プロジェクト別進捗</h3>
          <div className="space-y-5">
            {projects.length > 0 ? (
              projects.map((project) => (
                <ProgressBar
                  key={project.name}
                  label={project.name}
                  value={project.value}
                  height={10}
                />
              ))
            ) : (
              <p className="text-sm text-muted text-center py-4">
                プロジェクトがありません
              </p>
            )}
          </div>
        </div>

        {/* メンバー別進捗 */}
        <MemberProgress members={members} />
      </div>

      {/* カレンダー */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarView tasks={calendarTasks} />

        {/* 今週のタスク */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold mb-4">直近のタスク</h3>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-border/10 hover:bg-border/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          task.status === "in_progress"
                            ? "var(--color-status-progress)"
                            : task.status === "review"
                            ? "var(--color-status-review)"
                            : "var(--color-status-todo)",
                      }}
                    />
                    <span className="text-sm">{task.title}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {task.due_date.slice(5).replace("-", "/")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted text-center py-4">
                未完了のタスクはありません
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Inline Icons ---- */

function ClipboardIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

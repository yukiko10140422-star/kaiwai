"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import PageTransition from "@/components/ui/PageTransition";
import { Avatar } from "@/components/ui";
import {
  fetchDashboardStats,
  fetchMemberProgress,
  type DashboardStats,
  type MemberStat,
} from "@/lib/dashboard";
import { fetchTasks } from "@/lib/tasks";
import type { TaskCardData } from "@/components/tasks/TaskCard";
import dynamic from "next/dynamic";
const TaskDetailModal = dynamic(() => import("@/components/tasks/TaskDetailModal"), { ssr: false });
import { fetchNotifications } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";
import {
  ClipboardCheck,
  FolderOpen,
  BarChart3,
  Send,
  Circle,
  CircleDot,
} from "lucide-react";

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [members, setMembers] = useState<MemberStat[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<TaskCardData[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("おはようございます");
    else if (hour < 18) setGreeting("お疲れ様です");
    else setGreeting("こんばんは");
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardStats().then(d => { if (!cancelled) setStats(d); }).catch(console.error);
    fetchMemberProgress().then(d => { if (!cancelled) setMembers(d); }).catch(console.error);
    fetchTasks()
      .then((tasks) => {
        if (cancelled) return;
        const now = new Date();
        const upcoming = tasks
          .filter((t) => t.status !== "done" && t.due_date && new Date(t.due_date) >= now)
          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
          .slice(0, 5);
        setUpcomingTasks(upcoming);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications(userId, 5)
      .then(setRecentNotifications)
      .catch(console.error);
  }, [userId]);

  const completionRate =
    stats && stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="text-muted text-sm mt-1">今日のチーム状況をチェックしましょう</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="全タスク" value={stats?.total ?? 0} color="text-foreground" />
        <StatCard label="完了" value={stats?.completed ?? 0} color="text-status-done" />
        <StatCard label="進行中" value={stats?.inProgress ?? 0} color="text-status-progress" />
        <StatCard
          label="期限超過"
          value={stats?.overdue ?? 0}
          color="text-status-overdue"
          alert={!!stats && stats.overdue > 0}
        />
      </div>

      {/* Completion rate bar */}
      {stats && stats.total > 0 && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">全体完了率</span>
            <span className="text-sm font-bold text-accent">{completionRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming deadlines */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">直近の締め切り</h2>
            <Link href="/dashboard/tasks" className="text-xs text-accent hover:underline">
              すべて見る
            </Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">直近の締め切りはありません</p>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const daysLeft = Math.ceil(
                  (new Date(task.due_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-card/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot status={task.status} />
                      <span className="text-sm truncate">{task.title}</span>
                    </div>
                    <span
                      className={`text-xs shrink-0 ${
                        daysLeft <= 1 ? "text-status-overdue font-bold" : "text-muted"
                      }`}
                    >
                      {daysLeft <= 0 ? "今日" : daysLeft === 1 ? "明日" : `${daysLeft}日後`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Team members */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">メンバー進捗</h2>
            <Link href="/dashboard/progress" className="text-xs text-accent hover:underline">
              詳細
            </Link>
          </div>
          {members.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">メンバーデータなし</p>
          ) : (
            <div className="space-y-3">
              {members.slice(0, 5).map((m) => {
                const rate = m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0;
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar name={m.displayName} src={m.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{m.displayName}</span>
                        <span className="text-xs text-muted">{m.completedTasks}/{m.totalTasks}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent notifications */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-sm font-bold mb-3">最近の通知</h2>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">通知はありません</p>
          ) : (
            <div className="space-y-2">
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-2 py-2 px-3 rounded-lg ${
                    n.is_read ? "opacity-60" : ""
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {n.is_read ? (
                      <Circle className="w-3 h-3 text-muted" />
                    ) : (
                      <CircleDot className="w-3 h-3 text-accent" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-muted truncate">{n.body}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-sm font-bold mb-3">クイックアクセス</h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickLink href="/dashboard/tasks" label="タスクボード" icon={<ClipboardCheck className="w-5 h-5 text-accent" />} />
            <QuickLink href="/dashboard/projects" label="プロジェクト" icon={<FolderOpen className="w-5 h-5 text-accent" />} />
            <QuickLink href="/dashboard/progress" label="進捗ダッシュボード" icon={<BarChart3 className="w-5 h-5 text-accent" />} />
            <QuickLink href="/dashboard/settings/invite" label="メンバー招待" icon={<Send className="w-5 h-5 text-accent" />} />
          </div>
        </div>
      </div>

      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </PageTransition>
  );
}

function StatCard({
  label,
  value,
  color,
  alert,
}: {
  label: string;
  value: number;
  color: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`glass rounded-xl p-4 text-center ${alert ? "ring-1 ring-status-overdue/50" : ""}`}
    >
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    todo: "bg-status-todo",
    in_progress: "bg-status-progress",
    review: "bg-status-review",
    done: "bg-status-done",
  };
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colorMap[status] ?? "bg-muted"}`} />;
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-3 rounded-lg hover:bg-card/80 transition-colors border border-border/50"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
}

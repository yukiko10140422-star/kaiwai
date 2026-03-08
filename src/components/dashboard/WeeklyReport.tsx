"use client";

import { useState, useEffect } from "react";
import {
  generateWeeklyReport,
  type WeeklyReport as WeeklyReportType,
} from "@/lib/weekly-report";

export default function WeeklyReport() {
  const [report, setReport] = useState<WeeklyReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    setLoading(true);
    generateWeeklyReport(weekOffset)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [weekOffset]);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">週次レポート</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="text-muted hover:text-foreground text-sm"
          >
            &larr; 前週
          </button>
          {weekOffset > 0 && (
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="text-muted hover:text-foreground text-sm"
            >
              次週 &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Week range */}
      {report && (
        <p className="text-xs text-muted mb-4">
          {report.weekStart.replace(/-/g, "/")} ~{" "}
          {report.weekEnd.replace(/-/g, "/")}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted text-center py-4">集計中...</p>
      ) : !report ? (
        <p className="text-sm text-muted text-center py-4">
          データの取得に失敗しました
        </p>
      ) : (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-status-done">
                {report.completedTasks.length}
              </p>
              <p className="text-[11px] text-muted">完了タスク</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-accent">
                {report.newTasks.length}
              </p>
              <p className="text-[11px] text-muted">新規タスク</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-accent-secondary">
                {report.meetingNotes.length}
              </p>
              <p className="text-[11px] text-muted">議事録</p>
            </div>
          </div>

          {/* Completed tasks list */}
          {report.completedTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted mb-2">
                完了したタスク
              </h4>
              <ul className="space-y-1">
                {report.completedTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <svg
                      className="w-3.5 h-3.5 text-status-done shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Member ranking */}
          {report.memberStats.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted mb-2">
                メンバー別完了数
              </h4>
              <div className="space-y-1.5">
                {report.memberStats.map((m, i) => (
                  <div
                    key={m.name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-xs text-muted w-4">{i + 1}.</span>
                    <span className="flex-1 truncate">{m.name}</span>
                    <span className="text-xs font-medium">
                      {m.completedCount}件
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {report.completedTasks.length === 0 &&
            report.newTasks.length === 0 && (
              <p className="text-sm text-muted text-center py-2">
                この週のデータはありません
              </p>
            )}
        </div>
      )}
    </div>
  );
}

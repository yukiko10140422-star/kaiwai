"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui";
import {
  fetchActivityLogs,
  getActionLabel,
  type ActivityLogWithUser,
} from "@/lib/activity";
import type { ActivityAction } from "@/types/database";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0 || isNaN(diff)) return "たった今";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "たった今";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

function ActionIcon({ action }: { action: ActivityAction }) {
  const common = "w-3.5 h-3.5";
  switch (action) {
    case "task_created":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      );
    case "task_updated":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      );
    case "task_completed":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "task_assigned":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "message_sent":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "channel_created":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      );
    case "member_joined":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      );
    case "file_uploaded":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      );
    default:
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function actionColor(action: ActivityAction): string {
  switch (action) {
    case "task_completed":
      return "text-green-500";
    case "task_created":
      return "text-blue-500";
    case "task_updated":
      return "text-amber-500";
    case "task_assigned":
      return "text-purple-500";
    case "message_sent":
      return "text-sky-400";
    case "channel_created":
      return "text-indigo-400";
    case "member_joined":
      return "text-emerald-400";
    case "file_uploaded":
      return "text-orange-400";
    default:
      return "text-muted";
  }
}

export default function ActivityTimeline() {
  const [logs, setLogs] = useState<ActivityLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs(15)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-4">アクティビティ</h3>
        <div className="text-sm text-muted text-center py-4">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-4">アクティビティ</h3>
      {logs.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">
          アクティビティはまだありません
        </p>
      ) : (
        <div className="flex flex-col">
          {logs.map((log, i) => (
            <div key={log.id} className="flex gap-3 relative">
              {/* Timeline line */}
              {i < logs.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
              )}

              {/* Avatar */}
              <div className="shrink-0 z-10">
                <Avatar
                  name={log.user.display_name}
                  src={log.user.avatar_url}
                  size="sm"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {log.user.display_name}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <span className={actionColor(log.action)}>
                      <ActionIcon action={log.action} />
                    </span>
                    {getActionLabel(log.action)}
                  </span>
                </div>
                {log.metadata &&
                  typeof (log.metadata as Record<string, unknown>).title === "string" && (
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {(log.metadata as Record<string, string>).title}
                    </p>
                  )}
                <span className="text-[10px] text-muted">
                  {relativeTime(log.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

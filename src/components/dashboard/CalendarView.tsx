"use client";

import { useMemo, useState } from "react";

interface CalendarTask {
  id: string;
  title: string;
  due_date: string; // YYYY-MM-DD
  status: "todo" | "in_progress" | "review" | "done";
}

interface CalendarViewProps {
  tasks: CalendarTask[];
  className?: string;
}

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const STATUS_DOT_COLOR: Record<CalendarTask["status"], string> = {
  todo: "var(--color-status-todo)",
  in_progress: "var(--color-status-progress)",
  review: "var(--color-status-review)",
  done: "var(--color-status-done)",
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarView({ tasks, className = "" }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { days, startDay } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      days: lastDay.getDate(),
      startDay: firstDay.getDay(),
    };
  }, [year, month]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
      const existing = map.get(task.due_date) || [];
      existing.push(task);
      map.set(task.due_date, existing);
    }
    return map;
  }, [tasks]);

  function navigate(direction: -1 | 1) {
    const newDate = new Date(year, month + direction, 1);
    setYear(newDate.getFullYear());
    setMonth(newDate.getMonth());
  }

  function dateKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-border/30 transition-colors text-muted"
          aria-label="前月"
        >
          ◀
        </button>
        <h3 className="font-semibold">
          {year}年{month + 1}月
        </h3>
        <button
          onClick={() => navigate(1)}
          className="p-1.5 rounded-lg hover:bg-border/30 transition-colors text-muted"
          aria-label="翌月"
        >
          ▶
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs text-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const key = dateKey(day);
          const dayTasks = tasksByDate.get(key) || [];
          const isToday = isSameDay(new Date(year, month, day), today);

          return (
            <div
              key={day}
              className={`relative flex flex-col items-center rounded-lg p-1.5 min-h-[40px] text-sm transition-colors ${
                isToday
                  ? "bg-accent/20 font-bold"
                  : "hover:bg-border/20"
              }`}
            >
              <span>{day}</span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: STATUS_DOT_COLOR[t.status] }}
                      title={t.title}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

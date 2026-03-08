"use client";

import { useMemo, useState, useRef, useEffect } from "react";


interface CalendarTask {
  id: string;
  title: string;
  due_date: string; // YYYY-MM-DD
  status: "todo" | "in_progress" | "review" | "done";
}

interface CalendarViewProps {
  tasks: CalendarTask[];
  className?: string;
  onTaskClick?: (taskId: string) => void;
}

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const STATUS_DOT_COLOR: Record<CalendarTask["status"], string> = {
  todo: "var(--color-status-todo)",
  in_progress: "var(--color-status-progress)",
  review: "var(--color-status-review)",
  done: "var(--color-status-done)",
};

const STATUS_DOT_CLASS: Record<CalendarTask["status"], string> = {
  todo: "bg-status-todo",
  in_progress: "bg-status-progress",
  review: "bg-status-review",
  done: "bg-status-done",
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarView({ tasks, className = "", onTaskClick }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Close panel when clicking outside
  useEffect(() => {
    if (!selectedDate) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelectedDate(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedDate]);

  // Reset selected date when navigating months
  function navigate(direction: -1 | 1) {
    const newDate = new Date(year, month + direction, 1);
    setYear(newDate.getFullYear());
    setMonth(newDate.getMonth());
    setSelectedDate(null);
  }

  function dateKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function handleDateClick(key: string, hasTasks: boolean) {
    if (!hasTasks) return;
    setSelectedDate((prev) => (prev === key ? null : key));
  }

  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) ?? [] : [];

  return (
    <div className={`glass rounded-2xl p-5 ${className}`} ref={panelRef}>
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
          const hasTasks = dayTasks.length > 0;
          const isSelected = selectedDate === key;

          return (
            <div
              key={day}
              onClick={() => handleDateClick(key, hasTasks)}
              className={`relative flex flex-col items-center rounded-lg p-1.5 min-h-[40px] text-sm transition-colors ${
                isSelected
                  ? "bg-accent/30 ring-1 ring-accent/50"
                  : isToday
                  ? "bg-accent/20 font-bold"
                  : hasTasks
                  ? "hover:bg-border/30"
                  : "hover:bg-border/20"
              } ${hasTasks ? "cursor-pointer" : ""}`}
            >
              <span>{day}</span>
              {hasTasks && (
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

      {/* 選択日のタスク一覧パネル */}
      {selectedDate && selectedTasks.length > 0 && (
          <div
            className="mt-3 rounded-xl bg-card/80 backdrop-blur border border-border/50 p-3"
          >
            <p className="text-xs text-muted mb-2">
              {selectedDate.replace(/-/g, "/")} のタスク ({selectedTasks.length}件)
            </p>
            <div className="space-y-1.5">
              {selectedTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick?.(task.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-border/30 transition-colors text-left"
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_CLASS[task.status]}`}
                  />
                  <span className="text-sm truncate flex-1">{task.title}</span>
                  <span className="text-xs text-muted shrink-0">
                    {task.due_date.slice(5).replace("-", "/")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

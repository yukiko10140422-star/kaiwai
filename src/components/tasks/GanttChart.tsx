"use client";

import { useState, useMemo } from "react";
import type { TaskCardData } from "./TaskCard";
import type { TaskStatus } from "@/types/database";

const statusColors: Record<TaskStatus, string> = {
  todo: "bg-status-todo",
  in_progress: "bg-status-progress",
  review: "bg-status-review",
  done: "bg-status-done",
};

interface GanttChartProps {
  tasks: TaskCardData[];
  onTaskClick?: (task: TaskCardData) => void;
}

export default function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const DAYS = 21;
  const DAY_WIDTH = 40;

  const dates = useMemo(() => {
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  }, [startDate]);

  const endDate = dates[dates.length - 1];

  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      const taskStart = new Date(t.created_at);
      const taskEnd = t.due_date ? new Date(t.due_date) : taskStart;
      return taskEnd >= startDate && taskStart <= endDate;
    });
  }, [tasks, startDate, endDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getBarStyle = (task: TaskCardData) => {
    const taskStart = new Date(task.created_at);
    taskStart.setHours(0, 0, 0, 0);
    const taskEnd = task.due_date ? new Date(task.due_date) : null;

    const startOffset = Math.max(
      0,
      (taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (!taskEnd) {
      // No due date: show as a small dot/marker
      return {
        left: `${startOffset * DAY_WIDTH + DAY_WIDTH / 2 - 6}px`,
        width: "12px",
      };
    }

    const endOffset =
      (taskEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = Math.max(1, endOffset - startOffset + 1);

    return {
      left: `${startOffset * DAY_WIDTH}px`,
      width: `${duration * DAY_WIDTH}px`,
    };
  };

  const navigate = (direction: number) => {
    setStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + direction * 7);
      return d;
    });
  };

  const goToToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    d.setHours(0, 0, 0, 0);
    setStartDate(d);
  };

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="glass rounded-2xl overflow-hidden h-full flex flex-col">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="font-semibold text-sm">ガントチャート</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-muted hover:text-foreground text-sm px-2 py-1 rounded hover:bg-card transition-colors"
          >
            &larr; 前週
          </button>
          <button
            onClick={goToToday}
            className="text-xs text-accent hover:underline px-2 py-1"
          >
            今日
          </button>
          <button
            onClick={() => navigate(1)}
            className="text-muted hover:text-foreground text-sm px-2 py-1 rounded hover:bg-card transition-colors"
          >
            次週 &rarr;
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-y-auto">
        {/* Task names column */}
        <div className="shrink-0 w-48 border-r border-border">
          {/* Header spacer */}
          <div className="h-10 border-b border-border" />
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              className="h-10 flex items-center px-3 border-b border-border"
            >
              <span
                className="text-xs truncate cursor-pointer hover:text-accent transition-colors"
                onClick={() => onTaskClick?.(task)}
              >
                {task.title}
              </span>
            </div>
          ))}
          {visibleTasks.length === 0 && (
            <div className="h-20 flex items-center justify-center text-xs text-muted">
              この期間のタスクはありません
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-x-auto">
          <div style={{ width: `${DAYS * DAY_WIDTH}px` }}>
            {/* Date headers */}
            <div className="flex h-10 border-b border-border">
              {dates.map((d, i) => {
                const isToday = d.getTime() === today.getTime();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={`shrink-0 flex flex-col items-center justify-center border-r border-border text-[10px] ${
                      isToday
                        ? "bg-accent/10 text-accent font-bold"
                        : isWeekend
                          ? "bg-card/50 text-muted"
                          : "text-muted"
                    }`}
                    style={{ width: `${DAY_WIDTH}px` }}
                  >
                    <span>
                      {d.getMonth() + 1}/{d.getDate()}
                    </span>
                    <span className="text-[8px]">{dayNames[d.getDay()]}</span>
                  </div>
                );
              })}
            </div>

            {/* Task bars */}
            {visibleTasks.map((task) => (
              <div key={task.id} className="relative h-10 border-b border-border">
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {dates.map((d, i) => (
                    <div
                      key={i}
                      className={`shrink-0 border-r border-border ${
                        d.getTime() === today.getTime()
                          ? "bg-accent/5"
                          : d.getDay() === 0 || d.getDay() === 6
                            ? "bg-card/30"
                            : ""
                      }`}
                      style={{ width: `${DAY_WIDTH}px` }}
                    />
                  ))}
                </div>

                {/* Task bar */}
                <div
                  className={`absolute top-2 h-6 ${
                    task.due_date ? "rounded-full" : "rounded-full"
                  } ${statusColors[task.status]} opacity-80 hover:opacity-100 cursor-pointer transition-opacity flex items-center justify-center px-2`}
                  style={getBarStyle(task)}
                  onClick={() => onTaskClick?.(task)}
                  title={`${task.title}${task.due_date ? ` (期限: ${task.due_date})` : " (期限なし)"}`}
                >
                  {task.due_date && (
                    <span className="text-[10px] text-white font-medium truncate">
                      {task.title}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

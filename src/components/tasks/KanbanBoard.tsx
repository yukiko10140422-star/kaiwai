"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui";
import AnimatedList from "@/components/ui/AnimatedList";
import TaskCard, { type TaskCardData } from "./TaskCard";
import TaskDetailModal from "./TaskDetailModal";
import type { TaskStatus } from "@/types/database";

interface KanbanBoardProps {
  tasks: TaskCardData[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
}

const columns: { status: TaskStatus; label: string; variant: "todo" | "progress" | "review" | "done" }[] = [
  { status: "todo", label: "未着手", variant: "todo" },
  { status: "in_progress", label: "進行中", variant: "progress" },
  { status: "review", label: "レビュー", variant: "review" },
  { status: "done", label: "完了", variant: "done" },
];

export default function KanbanBoard({ tasks, onStatusChange, onDelete }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/plain");
      if (taskId) {
        onStatusChange(taskId, status);
      }
      setDragOverColumn(null);
    },
    [onStatusChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 h-full">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          const isOver = dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              className={`flex flex-col shrink-0 w-full md:w-72 rounded-xl transition-colors ${
                isOver ? "bg-accent/5 ring-2 ring-accent/20" : ""
              }`}
              onDrop={(e) => handleDrop(e, col.status)}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={col.variant}>{col.label}</Badge>
                  <span className="text-xs text-muted">{columnTasks.length}</span>
                </div>
              </div>

              {/* Cards */}
              <AnimatedList className="flex-1 space-y-3 px-1 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {columnTasks
                    .sort((a, b) => a.position - b.position)
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={setSelectedTask}
                      />
                    ))}
                </AnimatePresence>

                {/* Empty state */}
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border text-xs text-muted">
                    ドラッグしてここに移動
                  </div>
                )}
              </AnimatedList>
            </div>
          );
        })}
      </div>

      {/* Task detail modal */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={(taskId, status) => {
          onStatusChange(taskId, status);
          setSelectedTask((prev) =>
            prev && prev.id === taskId ? { ...prev, status } : prev
          );
        }}
        onDelete={onDelete}
      />
    </>
  );
}

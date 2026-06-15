"use client";

import { useState } from "react";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
  type Task,
  type TaskStatus,
  type UpdateTaskInput,
} from "@/lib/types";

interface KanbanBoardProps {
  tasks: Task[];
  onUpdate: (id: string, patch: UpdateTaskInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTagClick?: (tag: string) => void;
}

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  todo: "border-t-slate-400",
  in_progress: "border-t-blue-400",
  done: "border-t-emerald-400",
};

export function KanbanBoard({
  tasks,
  onUpdate,
  onDelete,
  onTagClick,
}: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  async function handleDrop(status: TaskStatus) {
    const id = draggingId;
    setDraggingId(null);
    setOverColumn(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    await onUpdate(id, { status });
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(status);
            }}
            onDragLeave={() => setOverColumn((c) => (c === status ? null : c))}
            onDrop={() => handleDrop(status)}
            className={`flex min-h-[8rem] flex-col gap-3 rounded-xl border border-t-4 ${COLUMN_ACCENT[status]} bg-canvas/60 p-3 transition ${
              overColumn === status ? "ring-2 ring-slate-400" : ""
            }`}
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-slate-700">
                {STATUS_LABELS[status]}
              </h3>
              <span className="rounded-full bg-slate-200 px-2 text-xs text-slate-600">
                {columnTasks.length}
              </span>
            </div>

            {columnTasks.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-slate-400">
                ここにドラッグ
              </p>
            ) : (
              columnTasks.map((task) => (
                <article
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggingId(task.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`cursor-grab rounded-lg border border-slate-200 bg-surface p-3 shadow-sm active:cursor-grabbing ${
                    draggingId === task.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 break-words text-sm font-medium text-slate-800">
                      {task.title}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}
                    >
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>

                  {task.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => onTagClick?.(tag)}
                          className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 transition hover:bg-slate-200"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{task.dueDate ? task.dueDate.slice(0, 10) : ""}</span>
                    <button
                      type="button"
                      onClick={() => onDelete(task.id)}
                      className="rounded px-1.5 py-0.5 text-red-600 transition hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

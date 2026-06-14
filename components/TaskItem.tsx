"use client";

import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
  type Task,
  type TaskStatus,
  type UpdateTaskInput,
} from "@/lib/types";

interface TaskItemProps {
  task: Task;
  onUpdate: (id: string, patch: UpdateTaskInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "border-slate-300",
  in_progress: "border-blue-400",
  done: "border-emerald-400",
};

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done") return false;
  return Date.parse(task.dueDate) < Date.now();
}

export function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  const overdue = isOverdue(task);

  return (
    <li
      className={`rounded-xl border-l-4 ${STATUS_STYLES[task.status]} border border-slate-200 bg-surface p-4 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`truncate font-medium ${task.status === "done" ? "text-slate-400 line-through" : "text-slate-800"}`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">
              {task.description}
            </p>
          )}
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
        >
          優先度: {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {task.dueDate && (
          <span className={overdue ? "font-semibold text-red-600" : ""}>
            期限: {task.dueDate.slice(0, 10)}
            {overdue && "（期限超過）"}
          </span>
        )}

        <label className="flex items-center gap-1">
          状態
          <select
            value={task.status}
            onChange={(e) =>
              onUpdate(task.id, { status: e.target.value as TaskStatus })
            }
            className="rounded border border-slate-300 px-1.5 py-1 text-xs"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="ml-auto rounded px-2 py-1 text-xs text-red-600 transition hover:bg-red-50"
        >
          削除
        </button>
      </div>
    </li>
  );
}

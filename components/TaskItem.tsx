"use client";

import { useState } from "react";
import { formatTags, parseTags } from "@/lib/tags";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskInput,
} from "@/lib/types";

interface TaskItemProps {
  task: Task;
  onUpdate: (id: string, patch: UpdateTaskInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTagClick?: (tag: string) => void;
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

export function TaskItem({ task, onUpdate, onDelete, onTagClick }: TaskItemProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <TaskEditor
        task={task}
        onCancel={() => setEditing(false)}
        onSave={async (patch) => {
          await onUpdate(task.id, patch);
          setEditing(false);
        }}
      />
    );
  }

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
          {task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick?.(tag)}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 transition hover:bg-slate-200"
                >
                  #{tag}
                </button>
              ))}
            </div>
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

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="rounded px-2 py-1 text-xs text-red-600 transition hover:bg-red-50"
          >
            削除
          </button>
        </div>
      </div>
    </li>
  );
}

interface TaskEditorProps {
  task: Task;
  onSave: (patch: UpdateTaskInput) => Promise<void>;
  onCancel: () => void;
}

function TaskEditor({ task, onSave, onCancel }: TaskEditorProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [tags, setTags] = useState(formatTags(task.tags));
  const [dueDate, setDueDate] = useState(task.dueDate?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        tags: parseTags(tags),
        dueDate: dueDate || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setSaving(false);
    }
  }

  return (
    <li className="space-y-3 rounded-xl border border-slate-300 bg-surface p-4 shadow-sm">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        maxLength={200}
        aria-label="タイトル"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="説明（任意）"
        className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        maxLength={2000}
        aria-label="説明"
      />
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <label className="flex items-center gap-2">
          優先度
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          期限
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="タグ（カンマ区切り）"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        aria-label="タグ"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          キャンセル
        </button>
      </div>
    </li>
  );
}

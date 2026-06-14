"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "@/lib/client";
import {
  STATUS_LABELS,
  TASK_STATUSES,
  type CreateTaskInput,
  type Task,
  type TaskStatus,
  type UpdateTaskInput,
} from "@/lib/types";
import { Filters } from "./Filters";
import { TaskForm } from "./TaskForm";
import { TaskItem } from "./TaskItem";

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 検索入力はデバウンスして API 呼び出しを抑制する。
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks({
        status: status === "all" ? undefined : status,
        search: debouncedSearch || undefined,
      });
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = useCallback(
    async (input: CreateTaskInput) => {
      await createTask(input);
      await load();
    },
    [load],
  );

  const handleUpdate = useCallback(
    async (id: string, patch: UpdateTaskInput) => {
      await updateTask(id, patch);
      await load();
    },
    [load],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteTask(id);
      await load();
    },
    [load],
  );

  // ステータス別の件数サマリー。
  const counts = useMemo(() => {
    const base: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      done: 0,
    };
    for (const task of tasks) base[task.status] += 1;
    return base;
  }, [tasks]);

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <aside className="space-y-6">
        <TaskForm onCreate={handleCreate} />

        <div className="rounded-xl border border-slate-200 bg-surface p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-700">
            サマリー
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {TASK_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between">
                <span>{STATUS_LABELS[s]}</span>
                <span className="font-semibold">{counts[s]}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="space-y-4">
        <Filters
          status={status}
          search={search}
          onStatusChange={setStatus}
          onSearchChange={setSearch}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">読み込み中…</p>
        ) : tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
            タスクがありません。左のフォームから追加してください。
          </p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

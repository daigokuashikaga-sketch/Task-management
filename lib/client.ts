import type {
  CreateTaskInput,
  Task,
  TaskFilter,
  UpdateTaskInput,
} from "./types";

/**
 * クライアント側から API を叩く薄いラッパー。
 * 戻り値の型を一元管理し、UI コンポーネントを fetch の詳細から切り離す。
 */

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      typeof detail?.error === "string"
        ? detail.error
        : "リクエストに失敗しました",
    );
  }
  return res.json() as Promise<T>;
}

export async function fetchTasks(filter: TaskFilter = {}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.search) params.set("search", filter.search);
  const query = params.toString();
  const res = await fetch(`/api/tasks${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  const data = await handle<{ tasks: Task[] }>(res);
  return data.tasks;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handle<{ task: Task }>(res);
  return data.task;
}

export async function updateTask(
  id: string,
  patch: UpdateTaskInput,
): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await handle<{ task: Task }>(res);
  return data.task;
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error("削除に失敗しました");
  }
}

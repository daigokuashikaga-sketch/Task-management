import { randomUUID } from "node:crypto";
import { applyFilter, type TaskRepository } from "./repository";
import type {
  CreateTaskInput,
  Task,
  TaskFilter,
  UpdateTaskInput,
} from "./types";

/**
 * インメモリ実装。永続化を伴わないためユニットテストに最適。
 * SQLite 実装と同じ TaskRepository を満たすので、テストで安全に差し替えられる。
 */
export class InMemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();

  list(filter?: TaskFilter): Task[] {
    return applyFilter([...this.tasks.values()], filter);
  }

  get(id: string): Task | null {
    return this.tasks.get(id) ?? null;
  }

  create(input: CreateTaskInput): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: input.title,
      description: input.description ?? "",
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id: string, patch: UpdateTaskInput): Task | null {
    const existing = this.tasks.get(id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...patch,
      description: patch.description ?? existing.description,
      dueDate: patch.dueDate === undefined ? existing.dueDate : patch.dueDate,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }
}

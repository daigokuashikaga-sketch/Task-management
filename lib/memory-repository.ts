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
 * Postgres 実装と同じ TaskRepository を満たすので、テストで安全に差し替えられる。
 *
 * すべての操作は userId でスコープし、他テナントのタスクには一切触れない。
 */
export class InMemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();

  async list(userId: string, filter?: TaskFilter): Promise<Task[]> {
    const owned = [...this.tasks.values()].filter(
      (task) => task.ownerId === userId,
    );
    return applyFilter(owned, filter);
  }

  async get(userId: string, id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task && task.ownerId === userId ? task : null;
  }

  async create(userId: string, input: CreateTaskInput): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      ownerId: userId,
      title: input.title,
      description: input.description ?? "",
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      tags: input.tags ?? [],
      dueDate: input.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async update(
    userId: string,
    id: string,
    patch: UpdateTaskInput,
  ): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing || existing.ownerId !== userId) return null;

    const updated: Task = {
      ...existing,
      ...patch,
      description: patch.description ?? existing.description,
      tags: patch.tags ?? existing.tags,
      dueDate: patch.dueDate === undefined ? existing.dueDate : patch.dueDate,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const existing = this.tasks.get(id);
    if (!existing || existing.ownerId !== userId) return false;
    return this.tasks.delete(id);
  }
}

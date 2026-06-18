import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DEMO_USER_ID } from "./auth";
import { applyFilter, type TaskRepository } from "./repository";
import type {
  CreateTaskInput,
  Task,
  TaskFilter,
  UpdateTaskInput,
} from "./types";

/**
 * JSON ファイルによる永続化実装。
 * ネイティブ依存が一切ないため、どの OS でも `npm install` だけで動く（ローカル開発の既定）。
 * データはメモリ上に保持し、変更のたびにファイルへ書き出す。
 *
 * すべての操作は userId でスコープし、他テナントのタスクには一切触れない。
 */
export class JsonFileTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();

  constructor(private readonly filename: string) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    this.load();
  }

  private load(): void {
    if (!fs.existsSync(this.filename)) return;
    try {
      const raw = fs.readFileSync(this.filename, "utf-8").trim();
      if (!raw) return;
      const parsed = JSON.parse(raw) as Task[];
      for (const task of parsed) {
        // 旧フォーマット（tags / ownerId 無し）との後方互換。
        this.tasks.set(task.id, {
          ...task,
          tags: task.tags ?? [],
          ownerId: task.ownerId ?? DEMO_USER_ID,
        });
      }
    } catch {
      // 壊れたファイルでも起動を止めない（空の状態から開始）。
    }
  }

  private persist(): void {
    const data = JSON.stringify([...this.tasks.values()], null, 2);
    fs.writeFileSync(this.filename, data, "utf-8");
  }

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
    this.persist();
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
    this.persist();
    return updated;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const existing = this.tasks.get(id);
    if (!existing || existing.ownerId !== userId) return false;
    const deleted = this.tasks.delete(id);
    if (deleted) this.persist();
    return deleted;
  }
}

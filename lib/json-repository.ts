import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { applyFilter, type TaskRepository } from "./repository";
import type {
  CreateTaskInput,
  Task,
  TaskFilter,
  UpdateTaskInput,
} from "./types";

/**
 * JSON ファイルによる永続化実装。
 * ネイティブ依存が一切ないため、どの OS でも `npm install` だけで動く（既定の実装）。
 * データはメモリ上に保持し、変更のたびにファイルへ書き出す。
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
      for (const task of parsed) this.tasks.set(task.id, task);
    } catch {
      // 壊れたファイルでも起動を止めない（空の状態から開始）。
    }
  }

  private persist(): void {
    const data = JSON.stringify([...this.tasks.values()], null, 2);
    fs.writeFileSync(this.filename, data, "utf-8");
  }

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
    this.persist();
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
    this.persist();
    return updated;
  }

  delete(id: string): boolean {
    const deleted = this.tasks.delete(id);
    if (deleted) this.persist();
    return deleted;
  }
}

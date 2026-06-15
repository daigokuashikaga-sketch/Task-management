import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { applyFilter, type TaskRepository } from "./repository";
import type {
  CreateTaskInput,
  Task,
  TaskFilter,
  TaskStatus,
  UpdateTaskInput,
} from "./types";

/**
 * SQLite による永続化実装。
 * - スキーマは初回接続時に冪等に作成する。
 * - フィルタ／並び替えは applyFilter に集約し、ロジックの一貫性を保つ。
 */
export class SqliteTaskRepository implements TaskRepository {
  private db: Database.Database;

  constructor(filename: string) {
    const dir = path.dirname(filename);
    fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(filename);
    this.db.pragma("journal_mode = WAL");
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          TEXT PRIMARY KEY,
        title       TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'todo',
        priority    TEXT NOT NULL DEFAULT 'medium',
        tags        TEXT NOT NULL DEFAULT '[]',
        due_date    TEXT,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);

    // 既存DBへの後方互換マイグレーション（tags 列の追加）。
    const columns = this.db.prepare(`PRAGMA table_info(tasks)`).all() as Array<{
      name: string;
    }>;
    if (!columns.some((c) => c.name === "tags")) {
      this.db.exec(`ALTER TABLE tasks ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'`);
    }
  }

  list(filter?: TaskFilter): Task[] {
    const rows = this.db.prepare(`SELECT * FROM tasks`).all() as TaskRow[];
    return applyFilter(rows.map(rowToTask), filter);
  }

  get(id: string): Task | null {
    const row = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as
      | TaskRow
      | undefined;
    return row ? rowToTask(row) : null;
  }

  create(input: CreateTaskInput): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: input.title,
      description: input.description ?? "",
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      tags: input.tags ?? [],
      dueDate: input.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.db
      .prepare(
        `INSERT INTO tasks (id, title, description, status, priority, tags, due_date, created_at, updated_at)
         VALUES (@id, @title, @description, @status, @priority, @tags, @dueDate, @createdAt, @updatedAt)`,
      )
      .run(toRow(task));

    return task;
  }

  update(id: string, patch: UpdateTaskInput): Task | null {
    const existing = this.get(id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...patch,
      description: patch.description ?? existing.description,
      tags: patch.tags ?? existing.tags,
      dueDate: patch.dueDate === undefined ? existing.dueDate : patch.dueDate,
      updatedAt: new Date().toISOString(),
    };

    this.db
      .prepare(
        `UPDATE tasks
            SET title = @title,
                description = @description,
                status = @status,
                priority = @priority,
                tags = @tags,
                due_date = @dueDate,
                updated_at = @updatedAt
          WHERE id = @id`,
      )
      .run(toRow(updated));

    return updated;
  }

  delete(id: string): boolean {
    const result = this.db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
    return result.changes > 0;
  }
}

interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Task["priority"];
  tags: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Task を SQLite の行（tags は JSON 文字列）へ変換する。 */
function toRow(task: Task): Record<string, unknown> {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    tags: JSON.stringify(task.tags),
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function rowToTask(row: TaskRow): Task {
  let tags: string[] = [];
  try {
    tags = row.tags ? (JSON.parse(row.tags) as string[]) : [];
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    tags,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

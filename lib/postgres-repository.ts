import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { applyFilter, type TaskRepository } from "./repository";
import * as schema from "./schema";
import { tasks, users } from "./schema";
import type {
  CreateTaskInput,
  Task,
  TaskFilter,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from "./types";
import {
  DuplicateEmailError,
  normalizeEmail,
  type CreateUserInput,
  type User,
  type UserRepository,
} from "./user-repository";

export type Database = PostgresJsDatabase<typeof schema>;

/**
 * Postgres 接続を生成する。
 * サーバーレスでの接続増殖を避けるため接続数は控えめ（max: 1）。実接続は遅延。
 */
export function createPostgresDatabase(connectionString: string): Database {
  const client = postgres(connectionString, { max: 1 });
  return drizzle(client, { schema });
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

type TaskRow = typeof tasks.$inferSelect;

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    tags: row.tags,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Drizzle/Postgres による TaskRepository 実装。すべて owner_id でスコープする。 */
export class PostgresTaskRepository implements TaskRepository {
  constructor(private readonly db: Database) {}

  async list(userId: string, filter?: TaskFilter): Promise<Task[]> {
    // 所有者での絞り込みはインデックス済み SQL で行い、
    // 検索・タグ・並び替えは applyFilter に集約して全ドライバで挙動を揃える。
    const rows = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.ownerId, userId));
    return applyFilter(rows.map(rowToTask), filter);
  }

  async get(userId: string, id: string): Promise<Task | null> {
    const [row] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.ownerId, userId)))
      .limit(1);
    return row ? rowToTask(row) : null;
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
    await this.db.insert(tasks).values(task);
    return task;
  }

  async update(
    userId: string,
    id: string,
    patch: UpdateTaskInput,
  ): Promise<Task | null> {
    const existing = await this.get(userId, id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...patch,
      description: patch.description ?? existing.description,
      tags: patch.tags ?? existing.tags,
      dueDate: patch.dueDate === undefined ? existing.dueDate : patch.dueDate,
      updatedAt: new Date().toISOString(),
    };

    await this.db
      .update(tasks)
      .set({
        title: updated.title,
        description: updated.description,
        status: updated.status,
        priority: updated.priority,
        tags: updated.tags,
        dueDate: updated.dueDate,
        updatedAt: updated.updatedAt,
      })
      .where(and(eq(tasks.id, id), eq(tasks.ownerId, userId)));

    return updated;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.ownerId, userId)))
      .returning({ id: tasks.id });
    return deleted.length > 0;
  }
}

type UserRow = typeof users.$inferSelect;

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
  };
}

/** Drizzle/Postgres による UserRepository 実装。 */
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizeEmail(email)))
      .limit(1);
    return row ? rowToUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ? rowToUser(row) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    if (await this.findByEmail(email)) {
      throw new DuplicateEmailError();
    }

    const user: User = {
      id: randomUUID(),
      email,
      name: input.name ?? null,
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString(),
    };

    try {
      await this.db.insert(users).values(user);
    } catch (error) {
      // 競合で一意制約に当たった場合も同じ例外へ正規化する。
      if (isUniqueViolation(error)) throw new DuplicateEmailError();
      throw error;
    }

    return user;
  }
}

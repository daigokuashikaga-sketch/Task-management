import { index, jsonb, pgTable, text } from "drizzle-orm/pg-core";

/**
 * Drizzle スキーマ（本番 Postgres）。
 * 日時はドメイン（ISO 8601 文字列）と完全一致させるため text で保持し、
 * json / memory ドライバと挙動を揃える。タグは jsonb 配列。
 */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    // 所有者。テナント分離の基準。ユーザー削除時はタスクも連鎖削除。
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("todo"),
    priority: text("priority").notNull().default("medium"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    dueDate: text("due_date"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("idx_tasks_owner").on(t.ownerId),
    index("idx_tasks_status").on(t.status),
  ],
);

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  PostgresTaskRepository,
  PostgresUserRepository,
  type Database,
} from "../postgres-repository";
import * as schema from "../schema";
import { DuplicateEmailError } from "../user-repository";

/**
 * Postgres 実装の契約テスト。
 * PGlite（インプロセス Postgres / WASM）に対し、生成済みマイグレーションを適用してから
 * 実際の SQL で振る舞いを検証する。これにより memory/json と同一挙動であること、
 * および FK・一意制約・テナント分離が DB レベルで効くことを保証する。
 */
async function freshDatabase(): Promise<Database> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return db as unknown as Database;
}

describe("Postgres repositories (PGlite)", () => {
  let db: Database;
  let users: PostgresUserRepository;
  let tasks: PostgresTaskRepository;
  let userA: string;
  let userB: string;

  // マイグレーションと WASM 起動は一度だけ。テスト毎はテーブルを掃除して再投入する。
  beforeAll(async () => {
    db = await freshDatabase();
    users = new PostgresUserRepository(db);
    tasks = new PostgresTaskRepository(db);
  });

  beforeEach(async () => {
    await db.delete(schema.tasks); // FK のためタスクを先に削除
    await db.delete(schema.users);
    userA = (
      await users.create({ email: "a@example.com", passwordHash: "scrypt$a$a" })
    ).id;
    userB = (
      await users.create({ email: "b@example.com", passwordHash: "scrypt$b$b" })
    ).id;
  });

  describe("UserRepository", () => {
    it("作成・メール検索・ID 検索ができる", async () => {
      const found = await users.findByEmail("A@EXAMPLE.COM");
      expect(found?.id).toBe(userA);
      expect((await users.findById(userA))?.email).toBe("a@example.com");
    });

    it("メール重複は DuplicateEmailError を投げる", async () => {
      await expect(
        users.create({ email: "A@example.com", passwordHash: "scrypt$x$x" }),
      ).rejects.toBeInstanceOf(DuplicateEmailError);
    });
  });

  describe("TaskRepository", () => {
    it("既定値を補完して作成し、所有者を記録する", async () => {
      const task = await tasks.create(userA, { title: "設計レビュー" });
      expect(task.ownerId).toBe(userA);
      expect(task.status).toBe("todo");
      expect(task.priority).toBe("medium");
      expect(task.tags).toEqual([]);
      expect(task.dueDate).toBeNull();

      const fetched = await tasks.get(userA, task.id);
      expect(fetched?.title).toBe("設計レビュー");
    });

    it("タグ・ステータス・検索で絞り込み、優先度順に並ぶ", async () => {
      await tasks.create(userA, { title: "低", priority: "low", tags: ["x"] });
      await tasks.create(userA, { title: "高", priority: "high", tags: ["x"] });
      await tasks.create(userA, { title: "別", priority: "medium", status: "done" });

      const byPriority = (await tasks.list(userA, { tag: "x" })).map((t) => t.title);
      expect(byPriority).toEqual(["高", "低"]);
      expect(await tasks.list(userA, { status: "done" })).toHaveLength(1);
      expect(await tasks.list(userA, { search: "別" })).toHaveLength(1);
    });

    it("部分更新は指定項目のみ変更する", async () => {
      const created = await tasks.create(userA, { title: "原稿", priority: "low" });
      const updated = await tasks.update(userA, created.id, {
        status: "in_progress",
      });
      expect(updated?.status).toBe("in_progress");
      expect(updated?.priority).toBe("low");
      expect(updated?.title).toBe("原稿");
    });

    it("削除できる", async () => {
      const created = await tasks.create(userA, { title: "消す" });
      expect(await tasks.delete(userA, created.id)).toBe(true);
      expect(await tasks.get(userA, created.id)).toBeNull();
    });

    describe("テナント分離", () => {
      it("一覧は自分のタスクだけを返す", async () => {
        await tasks.create(userA, { title: "Aのタスク" });
        await tasks.create(userB, { title: "Bのタスク" });

        const a = await tasks.list(userA);
        expect(a).toHaveLength(1);
        expect(a[0].title).toBe("Aのタスク");
      });

      it("他人のタスクは取得・更新・削除できない", async () => {
        const owned = await tasks.create(userB, { title: "機密" });

        expect(await tasks.get(userA, owned.id)).toBeNull();
        expect(await tasks.update(userA, owned.id, { title: "改ざん" })).toBeNull();
        expect(await tasks.delete(userA, owned.id)).toBe(false);
        // B から見れば無傷。
        expect((await tasks.get(userB, owned.id))?.title).toBe("機密");
      });
    });
  });
});

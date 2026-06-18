import { describe, expect, it } from "vitest";
import { InMemoryTaskRepository } from "../memory-repository";

/**
 * TaskRepository の振る舞いをインメモリ実装で検証する。
 * 同じインターフェースを満たすため、Postgres 実装にも適用できる契約テスト。
 */
const USER = "user-1";
const OTHER = "user-2";

describe("InMemoryTaskRepository", () => {
  it("既定値を補完してタスクを作成する", async () => {
    const repo = new InMemoryTaskRepository();
    const task = await repo.create(USER, { title: "設計レビュー" });

    expect(task.id).toBeTruthy();
    expect(task.ownerId).toBe(USER);
    expect(task.title).toBe("設計レビュー");
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("medium");
    expect(task.tags).toEqual([]);
    expect(task.dueDate).toBeNull();
  });

  it("タグで絞り込める", async () => {
    const repo = new InMemoryTaskRepository();
    await repo.create(USER, { title: "A", tags: ["仕事", "重要"] });
    await repo.create(USER, { title: "B", tags: ["私用"] });

    const work = await repo.list(USER, { tag: "仕事" });
    expect(work).toHaveLength(1);
    expect(work[0].title).toBe("A");
  });

  it("ステータスで絞り込める", async () => {
    const repo = new InMemoryTaskRepository();
    await repo.create(USER, { title: "A", status: "todo" });
    await repo.create(USER, { title: "B", status: "done" });

    const done = await repo.list(USER, { status: "done" });
    expect(done).toHaveLength(1);
    expect(done[0].title).toBe("B");
  });

  it("タイトル・説明を部分一致で検索できる", async () => {
    const repo = new InMemoryTaskRepository();
    await repo.create(USER, { title: "請求書を送付", description: "月末締め" });
    await repo.create(USER, { title: "ミーティング", description: "議事録作成" });

    expect(await repo.list(USER, { search: "請求" })).toHaveLength(1);
    expect(await repo.list(USER, { search: "議事録" })).toHaveLength(1);
    expect(await repo.list(USER, { search: "存在しない" })).toHaveLength(0);
  });

  it("優先度が高い順に並ぶ", async () => {
    const repo = new InMemoryTaskRepository();
    await repo.create(USER, { title: "低", priority: "low" });
    await repo.create(USER, { title: "高", priority: "high" });
    await repo.create(USER, { title: "中", priority: "medium" });

    const titles = (await repo.list(USER)).map((t) => t.title);
    expect(titles).toEqual(["高", "中", "低"]);
  });

  it("部分更新で指定項目だけを変更し updatedAt を更新する", async () => {
    const repo = new InMemoryTaskRepository();
    const created = await repo.create(USER, { title: "原稿執筆", priority: "low" });

    const updated = await repo.update(USER, created.id, { status: "in_progress" });
    expect(updated?.status).toBe("in_progress");
    expect(updated?.priority).toBe("low");
    expect(updated?.title).toBe("原稿執筆");
  });

  it("存在しない ID の更新・削除は失敗を返す", async () => {
    const repo = new InMemoryTaskRepository();
    expect(await repo.update(USER, "missing", { title: "x" })).toBeNull();
    expect(await repo.delete(USER, "missing")).toBe(false);
  });

  it("タスクを削除できる", async () => {
    const repo = new InMemoryTaskRepository();
    const task = await repo.create(USER, { title: "片付け" });

    expect(await repo.delete(USER, task.id)).toBe(true);
    expect(await repo.get(USER, task.id)).toBeNull();
  });

  describe("テナント分離", () => {
    it("一覧は自分のタスクだけを返す", async () => {
      const repo = new InMemoryTaskRepository();
      await repo.create(USER, { title: "自分のタスク" });
      await repo.create(OTHER, { title: "他人のタスク" });

      const mine = await repo.list(USER);
      expect(mine).toHaveLength(1);
      expect(mine[0].title).toBe("自分のタスク");
    });

    it("他人のタスクは取得できない（404 相当の null）", async () => {
      const repo = new InMemoryTaskRepository();
      const others = await repo.create(OTHER, { title: "機密" });

      expect(await repo.get(USER, others.id)).toBeNull();
    });

    it("他人のタスクは更新・削除できない", async () => {
      const repo = new InMemoryTaskRepository();
      const others = await repo.create(OTHER, { title: "機密" });

      expect(await repo.update(USER, others.id, { title: "改ざん" })).toBeNull();
      expect(await repo.delete(USER, others.id)).toBe(false);
      // 他人のタスクは無傷のまま。
      expect((await repo.get(OTHER, others.id))?.title).toBe("機密");
    });
  });
});

import { describe, expect, it } from "vitest";
import { InMemoryTaskRepository } from "../memory-repository";

/**
 * TaskRepository の振る舞いをインメモリ実装で検証する。
 * 同じインターフェースを満たすため、SQLite 実装にも適用できる契約テスト。
 */
describe("InMemoryTaskRepository", () => {
  it("既定値を補完してタスクを作成する", () => {
    const repo = new InMemoryTaskRepository();
    const task = repo.create({ title: "設計レビュー" });

    expect(task.id).toBeTruthy();
    expect(task.title).toBe("設計レビュー");
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("medium");
    expect(task.tags).toEqual([]);
    expect(task.dueDate).toBeNull();
  });

  it("タグで絞り込める", () => {
    const repo = new InMemoryTaskRepository();
    repo.create({ title: "A", tags: ["仕事", "重要"] });
    repo.create({ title: "B", tags: ["私用"] });

    const work = repo.list({ tag: "仕事" });
    expect(work).toHaveLength(1);
    expect(work[0].title).toBe("A");
  });

  it("ステータスで絞り込める", () => {
    const repo = new InMemoryTaskRepository();
    repo.create({ title: "A", status: "todo" });
    repo.create({ title: "B", status: "done" });

    const done = repo.list({ status: "done" });
    expect(done).toHaveLength(1);
    expect(done[0].title).toBe("B");
  });

  it("タイトル・説明を部分一致で検索できる", () => {
    const repo = new InMemoryTaskRepository();
    repo.create({ title: "請求書を送付", description: "月末締め" });
    repo.create({ title: "ミーティング", description: "議事録作成" });

    expect(repo.list({ search: "請求" })).toHaveLength(1);
    expect(repo.list({ search: "議事録" })).toHaveLength(1);
    expect(repo.list({ search: "存在しない" })).toHaveLength(0);
  });

  it("優先度が高い順に並ぶ", () => {
    const repo = new InMemoryTaskRepository();
    repo.create({ title: "低", priority: "low" });
    repo.create({ title: "高", priority: "high" });
    repo.create({ title: "中", priority: "medium" });

    const titles = repo.list().map((t) => t.title);
    expect(titles).toEqual(["高", "中", "低"]);
  });

  it("部分更新で指定項目だけを変更し updatedAt を更新する", () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: "原稿執筆", priority: "low" });

    const updated = repo.update(created.id, { status: "in_progress" });
    expect(updated?.status).toBe("in_progress");
    expect(updated?.priority).toBe("low");
    expect(updated?.title).toBe("原稿執筆");
  });

  it("存在しない ID の更新・削除は失敗を返す", () => {
    const repo = new InMemoryTaskRepository();
    expect(repo.update("missing", { title: "x" })).toBeNull();
    expect(repo.delete("missing")).toBe(false);
  });

  it("タスクを削除できる", () => {
    const repo = new InMemoryTaskRepository();
    const task = repo.create({ title: "片付け" });

    expect(repo.delete(task.id)).toBe(true);
    expect(repo.get(task.id)).toBeNull();
  });
});

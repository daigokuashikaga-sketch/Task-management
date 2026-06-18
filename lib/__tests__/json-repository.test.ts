import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonFileTaskRepository } from "../json-repository";

const USER = "user-1";
const OTHER = "user-2";

describe("JsonFileTaskRepository", () => {
  let file: string;

  beforeEach(() => {
    file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "tasks-")),
      "tasks.json",
    );
  });

  afterEach(() => {
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  });

  it("作成内容をファイルへ永続化する", async () => {
    const repo = new JsonFileTaskRepository(file);
    await repo.create(USER, { title: "永続化の確認" });

    expect(fs.existsSync(file)).toBe(true);
    expect(fs.readFileSync(file, "utf-8")).toContain("永続化の確認");
  });

  it("再生成しても保存済みデータを読み込める", async () => {
    const first = new JsonFileTaskRepository(file);
    await first.create(USER, { title: "再起動後も残る", priority: "high" });

    const second = new JsonFileTaskRepository(file);
    const tasks = await second.list(USER);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("再起動後も残る");
  });

  it("削除がファイルに反映される", async () => {
    const repo = new JsonFileTaskRepository(file);
    const task = await repo.create(USER, { title: "消す" });

    expect(await repo.delete(USER, task.id)).toBe(true);
    expect(await new JsonFileTaskRepository(file).list(USER)).toHaveLength(0);
  });

  it("永続化後も他テナントのデータは見えない", async () => {
    const repo = new JsonFileTaskRepository(file);
    await repo.create(USER, { title: "自分の" });
    await repo.create(OTHER, { title: "他人の" });

    // ファイルから読み直しても分離が保たれる。
    const reloaded = new JsonFileTaskRepository(file);
    const mine = await reloaded.list(USER);
    expect(mine).toHaveLength(1);
    expect(mine[0].title).toBe("自分の");
  });
});

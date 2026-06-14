import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonFileTaskRepository } from "../json-repository";

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

  it("作成内容をファイルへ永続化する", () => {
    const repo = new JsonFileTaskRepository(file);
    repo.create({ title: "永続化の確認" });

    expect(fs.existsSync(file)).toBe(true);
    expect(fs.readFileSync(file, "utf-8")).toContain("永続化の確認");
  });

  it("再生成しても保存済みデータを読み込める", () => {
    const first = new JsonFileTaskRepository(file);
    first.create({ title: "再起動後も残る", priority: "high" });

    const second = new JsonFileTaskRepository(file);
    const tasks = second.list();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("再起動後も残る");
  });

  it("削除がファイルに反映される", () => {
    const repo = new JsonFileTaskRepository(file);
    const task = repo.create({ title: "消す" });

    expect(repo.delete(task.id)).toBe(true);
    expect(new JsonFileTaskRepository(file).list()).toHaveLength(0);
  });
});

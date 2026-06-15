import { describe, expect, it } from "vitest";
import { createTaskSchema, updateTaskSchema } from "../validation";

describe("createTaskSchema", () => {
  it("最小限の入力（タイトルのみ）を受理する", () => {
    const result = createTaskSchema.safeParse({ title: "買い物" });
    expect(result.success).toBe(true);
  });

  it("空タイトルを拒否する", () => {
    const result = createTaskSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
  });

  it("不正なステータスを拒否する", () => {
    const result = createTaskSchema.safeParse({
      title: "x",
      status: "unknown",
    });
    expect(result.success).toBe(false);
  });

  it("YYYY-MM-DD 形式の期限を受理する", () => {
    const result = createTaskSchema.safeParse({
      title: "x",
      dueDate: "2026-06-30",
    });
    expect(result.success).toBe(true);
  });

  it("タグの重複を除去する", () => {
    const result = createTaskSchema.safeParse({ title: "x", tags: ["a", "a", "b"] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual(["a", "b"]);
  });
});

describe("updateTaskSchema", () => {
  it("空オブジェクトを拒否する", () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("一部項目のみの更新を受理する", () => {
    const result = updateTaskSchema.safeParse({ priority: "high" });
    expect(result.success).toBe(true);
  });
});

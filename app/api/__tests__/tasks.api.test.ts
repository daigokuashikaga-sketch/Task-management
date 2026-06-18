import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// 認証は別テストで検証する。ここでは固定ユーザーに解決して API 境界に集中する。
vi.mock("@/lib/auth", () => ({
  requireUserId: vi.fn(async () => "test-user"),
}));

/**
 * Route Handler の結合テスト。
 * DATABASE_PATH を一時ファイルに向けてから動的 import することで、
 * 実際の API 境界（バリデーション・ステータスコード・永続化）を検証する。
 */
let tasksRoute: typeof import("@/app/api/tasks/route");
let taskByIdRoute: typeof import("@/app/api/tasks/[id]/route");
let tmpDir: string;

function jsonRequest(method: string, body?: unknown): Request {
  return new Request("http://test.local/api/tasks", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "api-"));
  process.env.DB_DRIVER = "json";
  process.env.DATABASE_PATH = path.join(tmpDir, "tasks.json");
  tasksRoute = await import("@/app/api/tasks/route");
  taskByIdRoute = await import("@/app/api/tasks/[id]/route");
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.DATABASE_PATH;
  delete process.env.DB_DRIVER;
});

describe("Tasks API", () => {
  it("作成→一覧→更新→削除の一連が成功する", async () => {
    const created = await tasksRoute.POST(
      jsonRequest("POST", { title: "API経由のタスク", priority: "high" }),
    );
    expect(created.status).toBe(201);
    const { task } = (await created.json()) as { task: { id: string; title: string } };
    expect(task.title).toBe("API経由のタスク");

    const listed = await tasksRoute.GET(jsonRequest("GET"));
    expect(listed.status).toBe(200);
    const { tasks } = (await listed.json()) as { tasks: unknown[] };
    expect(tasks).toHaveLength(1);

    const patched = await taskByIdRoute.PATCH(jsonRequest("PATCH", { status: "done" }), {
      params: { id: task.id },
    });
    expect(patched.status).toBe(200);
    const updated = (await patched.json()) as { task: { status: string } };
    expect(updated.task.status).toBe("done");

    const deleted = await taskByIdRoute.DELETE(jsonRequest("DELETE"), {
      params: { id: task.id },
    });
    expect(deleted.status).toBe(204);
  });

  it("不正な入力は 400 を返す", async () => {
    const res = await tasksRoute.POST(jsonRequest("POST", { title: "" }));
    expect(res.status).toBe(400);
  });

  it("存在しない ID の取得は 404 を返す", async () => {
    const res = await taskByIdRoute.GET(jsonRequest("GET"), {
      params: { id: "does-not-exist" },
    });
    expect(res.status).toBe(404);
  });
});

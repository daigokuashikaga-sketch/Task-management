import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/lib/auth/constants";

// requireUserId をテスト毎に差し替え、認可境界（401・テナント分離）を検証する。
vi.mock("@/lib/auth", () => ({ requireUserId: vi.fn() }));
import { requireUserId } from "@/lib/auth";

const mockedRequire = vi.mocked(requireUserId);

let tasksRoute: typeof import("@/app/api/tasks/route");
let taskByIdRoute: typeof import("@/app/api/tasks/[id]/route");
let tmpDir: string;

function req(method: string, body?: unknown): Request {
  return new Request("http://test.local/api/tasks", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "authz-"));
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

beforeEach(() => {
  mockedRequire.mockReset();
});

describe("Tasks API 認可", () => {
  it("未認証は 401 を返す", async () => {
    mockedRequire.mockRejectedValueOnce(new UnauthorizedError());
    const res = await tasksRoute.GET(req("GET"));
    expect(res.status).toBe(401);
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });

  it("他ユーザーのタスクは参照・更新・削除できない", async () => {
    // user-a が作成
    mockedRequire.mockResolvedValue("user-a");
    const created = await tasksRoute.POST(req("POST", { title: "Aの機密" }));
    const { task } = (await created.json()) as { task: { id: string } };

    // 以降は user-b として操作
    mockedRequire.mockResolvedValue("user-b");
    expect((await tasksRoute.GET(req("GET"))).status).toBe(200);
    const list = await (await tasksRoute.GET(req("GET"))).json();
    expect((list as { tasks: unknown[] }).tasks).toHaveLength(0);

    const ctx = { params: { id: task.id } };
    expect((await taskByIdRoute.GET(req("GET"), ctx)).status).toBe(404);
    expect(
      (await taskByIdRoute.PATCH(req("PATCH", { title: "改ざん" }), ctx)).status,
    ).toBe(404);
    expect((await taskByIdRoute.DELETE(req("DELETE"), ctx)).status).toBe(404);

    // 所有者 user-a からは無傷で見える
    mockedRequire.mockResolvedValue("user-a");
    expect((await taskByIdRoute.GET(req("GET"), ctx)).status).toBe(200);
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * 登録 API のレート制限を検証する。
 * 上限を 2 に設定してからルートを読み込み、3 回目で 429 になることを確認する。
 */
let route: typeof import("@/app/api/auth/register/route");

function req(email: string): Request {
  return new Request("http://test.local/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
}

beforeAll(async () => {
  process.env.DB_DRIVER = "memory";
  process.env.RATE_LIMIT_REGISTER = "2";
  route = await import("@/app/api/auth/register/route");
});

afterAll(() => {
  delete process.env.DB_DRIVER;
  delete process.env.RATE_LIMIT_REGISTER;
});

describe("Register API レート制限", () => {
  it("上限超過は 429 と Retry-After を返す", async () => {
    expect((await route.POST(req("r1@example.com"))).status).toBe(201);
    expect((await route.POST(req("r2@example.com"))).status).toBe(201);
    const blocked = await route.POST(req("r3@example.com"));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });
});

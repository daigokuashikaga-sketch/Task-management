import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * 登録 API の結合テスト。
 * インメモリドライバに向けてから動的 import し、ディスクを汚さずに検証する。
 */
let route: typeof import("@/app/api/auth/register/route");

function jsonReq(body?: unknown): Request {
  return new Request("http://test.local/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeAll(async () => {
  process.env.DB_DRIVER = "memory";
  route = await import("@/app/api/auth/register/route");
});

afterAll(() => {
  delete process.env.DB_DRIVER;
});

describe("Register API", () => {
  it("有効な登録は 201 を返し、応答にパスワードハッシュを含めない", async () => {
    const res = await route.POST(
      jsonReq({ email: "new@example.com", password: "password123", name: "New" }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { user: Record<string, unknown> };
    expect(body.user.email).toBe("new@example.com");
    expect(body.user).not.toHaveProperty("passwordHash");
    expect(body.user).not.toHaveProperty("password");
  });

  it("重複メールは 409 を返す", async () => {
    await route.POST(jsonReq({ email: "dup@example.com", password: "password123" }));
    const res = await route.POST(
      jsonReq({ email: "DUP@example.com", password: "password123" }),
    );
    expect(res.status).toBe(409);
  });

  it("短すぎるパスワードは 400 を返す", async () => {
    const res = await route.POST(
      jsonReq({ email: "short@example.com", password: "123" }),
    );
    expect(res.status).toBe(400);
  });

  it("壊れた JSON は 400 を返す", async () => {
    const res = await route.POST(
      new Request("http://test.local/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ not json",
      }),
    );
    expect(res.status).toBe(400);
  });
});

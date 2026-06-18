import { describe, expect, it, vi } from "vitest";

// DB 疎通失敗時に 503 を返すことを検証する。
vi.mock("@/lib/db", () => ({
  checkDatabase: vi.fn(async () => {
    throw new Error("db unreachable");
  }),
  activeDriver: () => "postgres",
}));

describe("Health API (DB ダウン時)", () => {
  it("疎通失敗は 503 と status:error を返す", async () => {
    const route = await import("@/app/api/health/route");
    const res = await route.GET(new Request("http://test.local/api/health"), {});
    expect(res.status).toBe(503);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("error");
  });
});

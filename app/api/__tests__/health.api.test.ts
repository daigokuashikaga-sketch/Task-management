import { afterAll, beforeAll, describe, expect, it } from "vitest";

/** ヘルスエンドポイントの結合テスト（メモリドライバで疎通を検証）。 */
let route: typeof import("@/app/api/health/route");

beforeAll(async () => {
  process.env.DB_DRIVER = "memory";
  route = await import("@/app/api/health/route");
});

afterAll(() => {
  delete process.env.DB_DRIVER;
});

describe("Health API", () => {
  it("疎通できれば 200 と status:ok を返す", async () => {
    const res = await route.GET(new Request("http://test.local/api/health"), {});
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; driver: string };
    expect(body.status).toBe("ok");
    expect(body.driver).toBe("memory");
  });

  it("応答に x-request-id を付与する", async () => {
    const res = await route.GET(new Request("http://test.local/api/health"), {});
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });
});

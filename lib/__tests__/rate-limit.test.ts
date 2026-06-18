import { describe, expect, it } from "vitest";
import { RateLimiter, clientIp } from "../rate-limit";

describe("RateLimiter", () => {
  it("上限までは許可し、超過は拒否する", () => {
    const limiter = new RateLimiter(3, 1000);
    const t = 0;
    expect(limiter.check("ip", t).allowed).toBe(true);
    expect(limiter.check("ip", t).allowed).toBe(true);
    expect(limiter.check("ip", t).allowed).toBe(true);
    const blocked = limiter.check("ip", t);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("ウィンドウ経過後にリセットされる", () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.check("ip", 0).allowed).toBe(true);
    expect(limiter.check("ip", 500).allowed).toBe(false);
    expect(limiter.check("ip", 1000).allowed).toBe(true);
  });

  it("key（IP）ごとに独立して数える", () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 0).allowed).toBe(false);
  });
});

describe("clientIp", () => {
  it("x-forwarded-for の先頭を採用する", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("ヘッダが無ければ unknown", () => {
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});

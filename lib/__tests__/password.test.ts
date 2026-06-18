import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("password (scrypt)", () => {
  it("ハッシュは平文を含まず、スキームを前置する", async () => {
    const hash = await hashPassword("s3cret-password");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).not.toContain("s3cret-password");
  });

  it("正しいパスワードを検証できる", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("誤ったパスワードを拒否する", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("同じパスワードでもソルトにより毎回異なるハッシュになる", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
    expect(await verifyPassword("same", a)).toBe(true);
    expect(await verifyPassword("same", b)).toBe(true);
  });

  it("壊れた保存値は安全に false を返す", async () => {
    expect(await verifyPassword("x", "not-a-valid-hash")).toBe(false);
    expect(await verifyPassword("x", "scrypt$deadbeef$")).toBe(false);
  });
});

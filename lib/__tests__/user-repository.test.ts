import { describe, expect, it } from "vitest";
import { InMemoryUserRepository } from "../memory-user-repository";
import { DuplicateEmailError, normalizeEmail } from "../user-repository";

describe("InMemoryUserRepository", () => {
  it("ユーザーを作成し ID で取得できる", async () => {
    const repo = new InMemoryUserRepository();
    const user = await repo.create({
      email: "alice@example.com",
      name: "Alice",
      passwordHash: "scrypt$aa$bb",
    });

    expect(user.id).toBeTruthy();
    expect(await repo.findById(user.id)).toEqual(user);
  });

  it("メールアドレスを正規化して保存・検索する（大文字小文字・空白を無視）", async () => {
    const repo = new InMemoryUserRepository();
    await repo.create({
      email: "  Bob@Example.COM ",
      passwordHash: "scrypt$aa$bb",
    });

    const found = await repo.findByEmail("bob@example.com");
    expect(found?.email).toBe("bob@example.com");
    // 別の表記でも同一ユーザーに解決される。
    expect((await repo.findByEmail("BOB@EXAMPLE.COM"))?.id).toBe(found?.id);
  });

  it("メール重複は DuplicateEmailError を投げる", async () => {
    const repo = new InMemoryUserRepository();
    await repo.create({ email: "dup@example.com", passwordHash: "scrypt$aa$bb" });

    await expect(
      repo.create({ email: "DUP@example.com", passwordHash: "scrypt$cc$dd" }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });

  it("存在しないメール・ID は null を返す", async () => {
    const repo = new InMemoryUserRepository();
    expect(await repo.findByEmail("nobody@example.com")).toBeNull();
    expect(await repo.findById("missing")).toBeNull();
  });

  it("normalizeEmail は前後空白を除去し小文字化する", () => {
    expect(normalizeEmail("  Foo@Bar.com ")).toBe("foo@bar.com");
  });
});

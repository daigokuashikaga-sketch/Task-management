import { describe, expect, it } from "vitest";
import { authorizeCredentials } from "../auth/config";
import { InMemoryUserRepository } from "../memory-user-repository";
import { hashPassword } from "../password";

/** authorizeCredentials の検証（ユーザーストアを注入してランタイム非依存にする）。 */
async function seededRepo() {
  const repo = new InMemoryUserRepository();
  await repo.create({
    email: "user@example.com",
    name: "User",
    passwordHash: await hashPassword("correct-password"),
  });
  return repo;
}

describe("authorizeCredentials", () => {
  it("正しい資格情報で公開ユーザーを返す（パスワードハッシュは漏らさない）", async () => {
    const repo = await seededRepo();
    const result = await authorizeCredentials(
      { email: "user@example.com", password: "correct-password" },
      repo,
    );

    expect(result).toMatchObject({ email: "user@example.com", name: "User" });
    expect(result).toHaveProperty("id");
    expect(result as Record<string, unknown>).not.toHaveProperty("passwordHash");
  });

  it("大文字のメールでも解決できる", async () => {
    const repo = await seededRepo();
    const result = await authorizeCredentials(
      { email: "USER@EXAMPLE.COM", password: "correct-password" },
      repo,
    );
    expect(result?.email).toBe("user@example.com");
  });

  it("誤ったパスワードは null", async () => {
    const repo = await seededRepo();
    expect(
      await authorizeCredentials(
        { email: "user@example.com", password: "wrong" },
        repo,
      ),
    ).toBeNull();
  });

  it("未登録のメールは null", async () => {
    const repo = await seededRepo();
    expect(
      await authorizeCredentials(
        { email: "ghost@example.com", password: "whatever" },
        repo,
      ),
    ).toBeNull();
  });

  it("不正な入力は null", async () => {
    const repo = await seededRepo();
    expect(await authorizeCredentials({ email: "not-an-email" }, repo)).toBeNull();
    expect(await authorizeCredentials(null, repo)).toBeNull();
  });
});

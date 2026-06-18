import { expect, test } from "@playwright/test";

/**
 * 主要導線のスモーク E2E。
 * 入力欄は type 属性で特定し、ラベル文言の変更に強くしている。
 */

test("ヘルスチェックが ok を返す", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { status: string };
  expect(body.status).toBe("ok");
});

test("新規登録 → 自動ログイン → タスク作成", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "新規登録" })).toBeVisible();

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill("password123");
  await page.getByRole("button", { name: "アカウント作成" }).click();

  // 登録後は自動サインインしてホームへ遷移する。
  await expect(page.getByRole("heading", { name: "タスク管理" })).toBeVisible();

  const title = `E2Eタスク-${Date.now()}`;
  await page.getByPlaceholder("タイトル（必須）").fill(title);
  await page.getByRole("button", { name: "タスクを追加" }).click();

  await expect(page.getByText(title)).toBeVisible();
});

test("未ログインでホームに来たらログイン画面へ誘導される", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
});

import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * E2E 設定。
 * 本番ビルドを起動し、メモリドライバ＋ダミー秘密で隔離して実行する。
 * ブラウザのダウンロードが必要なため CI（または `npm run test:e2e:install` 済み環境）で実行する。
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      AUTH_SECRET: "e2e-placeholder-secret",
      DB_DRIVER: "memory",
    },
  },
});

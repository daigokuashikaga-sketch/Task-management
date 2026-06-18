import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit 設定。
 * - generate: スキーマから ./drizzle に SQL マイグレーションを生成。
 * - migrate : DATABASE_URL の Postgres へマイグレーションを適用。
 */
export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});

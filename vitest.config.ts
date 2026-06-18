import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // E2E（Playwright）は別ランナーで実行する。
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      // ロジック層に限定して計測（UI コンポーネントは別途コンポーネントテストで担保予定）。
      include: ["lib/**/*.ts", "app/api/**/*.ts"],
      exclude: [
        "**/__tests__/**",
        "lib/schema.ts", // 宣言的スキーマ
        "lib/auth/index.ts", // NextAuth 初期化（結合テストで担保）
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});

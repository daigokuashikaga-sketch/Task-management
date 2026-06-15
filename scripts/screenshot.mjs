// @ts-check
/**
 * UI のスクリーンショットを撮影するスクリプト。
 *
 * 使い方:
 *   1. 別ターミナルでアプリを起動（サンプルデータ入り）:
 *        DB_DRIVER=memory npm run dev
 *   2. Playwright を導入してブラウザを取得:
 *        npm i -D playwright && npx playwright install chromium
 *   3. このスクリプトを実行:
 *        node scripts/screenshot.mjs
 *
 *   出力: docs/screenshots/list.png, docs/screenshots/board.png
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = "docs/screenshots";

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(BASE_URL, { waitUntil: "networkidle" });
await page.waitForSelector("text=タスク管理");
await page.screenshot({ path: `${OUT_DIR}/list.png`, fullPage: true });

// ボード表示に切り替えて撮影
await page.getByRole("button", { name: "ボード" }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT_DIR}/board.png`, fullPage: true });

await browser.close();
console.log(`Saved screenshots to ${OUT_DIR}/`);

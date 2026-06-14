import { createRequire } from "node:module";
import path from "node:path";
import { JsonFileTaskRepository } from "./json-repository";
import type { TaskRepository } from "./repository";

/**
 * リポジトリのシングルトン。
 * Next.js の開発時 HMR で接続が増殖しないよう globalThis にキャッシュする。
 *
 * 既定はネイティブ依存のない JSON ファイル実装。
 * `DB_DRIVER=sqlite` を指定し better-sqlite3 を導入済みの場合のみ SQLite を使う。
 */
const globalForRepo = globalThis as unknown as {
  taskRepository?: TaskRepository;
};

function resolveDataPath(fallbackFile: string): string {
  if (process.env.DATABASE_PATH) return path.resolve(process.env.DATABASE_PATH);
  return path.join(process.cwd(), "data", fallbackFile);
}

function createRepository(): TaskRepository {
  if (process.env.DB_DRIVER === "sqlite") {
    // 任意実装。better-sqlite3（ネイティブモジュール）を導入済みのときだけ読み込む。
    const require = createRequire(import.meta.url);
    const { SqliteTaskRepository } =
      require("./sqlite-repository") as typeof import("./sqlite-repository");
    return new SqliteTaskRepository(resolveDataPath("tasks.db"));
  }

  return new JsonFileTaskRepository(resolveDataPath("tasks.json"));
}

export function getTaskRepository(): TaskRepository {
  if (!globalForRepo.taskRepository) {
    globalForRepo.taskRepository = createRepository();
  }
  return globalForRepo.taskRepository;
}

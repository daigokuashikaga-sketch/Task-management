import { createRequire } from "node:module";
import path from "node:path";
import { JsonFileTaskRepository } from "./json-repository";
import { InMemoryTaskRepository } from "./memory-repository";
import type { TaskRepository } from "./repository";

/**
 * リポジトリのシングルトン。
 * Next.js の開発時 HMR で接続が増殖しないよう globalThis にキャッシュする。
 *
 * ドライバの選択:
 * - 既定（ローカル）       : JSON ファイル（依存ゼロで永続化）
 * - Vercel などサーバーレス : インメモリ（ファイル書き込み不可のため）＋デモ用シード
 * - DB_DRIVER で明示指定可  : json / memory / sqlite
 */
const globalForRepo = globalThis as unknown as {
  taskRepository?: TaskRepository;
};

type Driver = "json" | "memory" | "sqlite";

function resolveDriver(): Driver {
  if (process.env.DB_DRIVER) return process.env.DB_DRIVER as Driver;
  // Vercel のサーバーレス環境はファイルシステムが読み取り専用のためインメモリを使う。
  if (process.env.VERCEL) return "memory";
  return "json";
}

function resolveDataPath(fallbackFile: string): string {
  if (process.env.DATABASE_PATH) return path.resolve(process.env.DATABASE_PATH);
  return path.join(process.cwd(), "data", fallbackFile);
}

/** デモ環境（インメモリ）でも画面が空にならないようサンプルを投入する。 */
function seed(repo: TaskRepository): TaskRepository {
  if (repo.list().length > 0) return repo;
  repo.create({
    title: "採用面談の準備をする",
    description: "ポートフォリオと想定質問をまとめる",
    status: "in_progress",
    priority: "high",
    tags: ["仕事", "重要"],
    dueDate: "2026-06-20",
  });
  repo.create({
    title: "README を仕上げる",
    status: "todo",
    priority: "medium",
    tags: ["ドキュメント"],
  });
  repo.create({
    title: "テストを追加する",
    status: "done",
    priority: "low",
    tags: ["開発"],
  });
  return repo;
}

function createRepository(): TaskRepository {
  const driver = resolveDriver();

  if (driver === "sqlite") {
    // 任意実装。better-sqlite3（ネイティブモジュール）を導入済みのときだけ読み込む。
    const require = createRequire(import.meta.url);
    const { SqliteTaskRepository } =
      require("./sqlite-repository") as typeof import("./sqlite-repository");
    return new SqliteTaskRepository(resolveDataPath("tasks.db"));
  }

  if (driver === "memory") {
    return seed(new InMemoryTaskRepository());
  }

  return new JsonFileTaskRepository(resolveDataPath("tasks.json"));
}

export function getTaskRepository(): TaskRepository {
  if (!globalForRepo.taskRepository) {
    globalForRepo.taskRepository = createRepository();
  }
  return globalForRepo.taskRepository;
}

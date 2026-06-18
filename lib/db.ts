import path from "node:path";
import { DEMO_USER_ID } from "./auth";
import { JsonFileTaskRepository } from "./json-repository";
import { InMemoryTaskRepository } from "./memory-repository";
import type { TaskRepository } from "./repository";

/**
 * リポジトリのシングルトン。
 * Next.js の開発時 HMR で接続が増殖しないよう globalThis にキャッシュする。
 * 初期化（シード投入など）は非同期になり得るため Promise をキャッシュし、
 * 並行リクエストでも初期化が一度だけ走るようにする。
 *
 * ドライバの選択:
 * - 既定（ローカル）       : JSON ファイル（依存ゼロで永続化）
 * - Vercel などサーバーレス : インメモリ（ファイル書き込み不可のため）＋デモ用シード
 * - DB_DRIVER で明示指定可  : json / memory
 *
 * 本番向けの Postgres ドライバは Phase 2 で追加する。
 */
const globalForRepo = globalThis as unknown as {
  taskRepositoryPromise?: Promise<TaskRepository>;
};

type Driver = "json" | "memory";

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
async function seed(repo: TaskRepository): Promise<TaskRepository> {
  if ((await repo.list(DEMO_USER_ID)).length > 0) return repo;
  await repo.create(DEMO_USER_ID, {
    title: "採用面談の準備をする",
    description: "ポートフォリオと想定質問をまとめる",
    status: "in_progress",
    priority: "high",
    tags: ["仕事", "重要"],
    dueDate: "2026-06-20",
  });
  await repo.create(DEMO_USER_ID, {
    title: "README を仕上げる",
    status: "todo",
    priority: "medium",
    tags: ["ドキュメント"],
  });
  await repo.create(DEMO_USER_ID, {
    title: "テストを追加する",
    status: "done",
    priority: "low",
    tags: ["開発"],
  });
  return repo;
}

async function initRepository(): Promise<TaskRepository> {
  const driver = resolveDriver();

  if (driver === "memory") {
    return seed(new InMemoryTaskRepository());
  }

  return new JsonFileTaskRepository(resolveDataPath("tasks.json"));
}

export function getTaskRepository(): Promise<TaskRepository> {
  if (!globalForRepo.taskRepositoryPromise) {
    globalForRepo.taskRepositoryPromise = initRepository();
  }
  return globalForRepo.taskRepositoryPromise;
}

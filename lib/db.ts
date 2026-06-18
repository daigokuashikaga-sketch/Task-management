import path from "node:path";
import { DEMO_USER_ID } from "./auth/constants";
import { JsonFileTaskRepository } from "./json-repository";
import { JsonFileUserRepository } from "./json-user-repository";
import { InMemoryTaskRepository } from "./memory-repository";
import { InMemoryUserRepository } from "./memory-user-repository";
import {
  createPostgresDatabase,
  PostgresTaskRepository,
  PostgresUserRepository,
  type Database,
} from "./postgres-repository";
import type { TaskRepository } from "./repository";
import type { UserRepository } from "./user-repository";

/**
 * リポジトリのシングルトン。
 * Next.js の開発時 HMR で接続が増殖しないよう globalThis にキャッシュする。
 * 初期化（シード投入など）は非同期になり得るため Promise をキャッシュし、
 * 並行リクエストでも初期化が一度だけ走るようにする。
 *
 * ドライバの選択（優先順）:
 * 1. DB_DRIVER で明示指定（json / memory / postgres）
 * 2. DATABASE_URL があれば postgres（本番）
 * 3. Vercel などサーバーレスは memory（読み取り専用 FS のためデモ用シード）
 * 4. 既定はローカルの JSON ファイル（依存ゼロで永続化）
 */
const globalForRepo = globalThis as unknown as {
  taskRepositoryPromise?: Promise<TaskRepository>;
  userRepository?: UserRepository;
  postgresDatabase?: Database;
};

type Driver = "json" | "memory" | "postgres";

function resolveDriver(): Driver {
  if (process.env.DB_DRIVER) return process.env.DB_DRIVER as Driver;
  if (process.env.DATABASE_URL) return "postgres";
  if (process.env.VERCEL) return "memory";
  return "json";
}

function resolveDataPath(fallbackFile: string): string {
  if (process.env.DATABASE_PATH) return path.resolve(process.env.DATABASE_PATH);
  return path.join(process.cwd(), "data", fallbackFile);
}

/** Postgres 接続のシングルトン。実接続は初回クエリまで遅延する。 */
function getPostgresDatabase(): Database {
  if (!globalForRepo.postgresDatabase) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL が未設定です（postgres ドライバには接続文字列が必要です）",
      );
    }
    globalForRepo.postgresDatabase = createPostgresDatabase(url);
  }
  return globalForRepo.postgresDatabase;
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

  if (driver === "postgres") {
    return new PostgresTaskRepository(getPostgresDatabase());
  }

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

function createUserRepository(): UserRepository {
  const driver = resolveDriver();

  if (driver === "postgres") {
    return new PostgresUserRepository(getPostgresDatabase());
  }
  if (driver === "memory") {
    return new InMemoryUserRepository();
  }
  return new JsonFileUserRepository(resolveDataPath("users.json"));
}

export function getUserRepository(): UserRepository {
  if (!globalForRepo.userRepository) {
    globalForRepo.userRepository = createUserRepository();
  }
  return globalForRepo.userRepository;
}

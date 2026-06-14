import path from "node:path";
import type { TaskRepository } from "./repository";
import { SqliteTaskRepository } from "./sqlite-repository";

/**
 * リポジトリのシングルトン。
 * Next.js の開発時 HMR で接続が増殖しないよう globalThis にキャッシュする。
 */
const globalForRepo = globalThis as unknown as {
  taskRepository?: TaskRepository;
};

function createRepository(): TaskRepository {
  const file = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(process.cwd(), "data", "tasks.db");
  return new SqliteTaskRepository(file);
}

export function getTaskRepository(): TaskRepository {
  if (!globalForRepo.taskRepository) {
    globalForRepo.taskRepository = createRepository();
  }
  return globalForRepo.taskRepository;
}

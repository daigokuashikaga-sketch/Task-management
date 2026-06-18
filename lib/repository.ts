import type {
  CreateTaskInput,
  Task,
  TaskFilter,
  UpdateTaskInput,
} from "./types";

/**
 * 永続化の抽象。アプリ本体は具体的なストレージ実装ではなく
 * このインターフェースに依存する（依存性逆転）。
 * 実行時は Postgres 実装、テスト時はインメモリ実装に差し替えられる。
 *
 * すべての操作は所有ユーザー（userId）でスコープされる。
 * userId を必須引数にすることで、テナント越境アクセスを型レベルで防ぐ。
 * Promise を返すのは、サーバーレス Postgres など非同期ドライバを許容するため。
 */
export interface TaskRepository {
  list(userId: string, filter?: TaskFilter): Promise<Task[]>;
  get(userId: string, id: string): Promise<Task | null>;
  create(userId: string, input: CreateTaskInput): Promise<Task>;
  update(userId: string, id: string, patch: UpdateTaskInput): Promise<Task | null>;
  delete(userId: string, id: string): Promise<boolean>;
}

/**
 * 検索・並び替えのロジックは実装間で共通化しておく。
 * 並び順: 優先度（高→低）→ 期限（近い順, 未設定は末尾）→ 作成日時（新しい順）。
 */
const PRIORITY_RANK: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function applyFilter(tasks: Task[], filter?: TaskFilter): Task[] {
  let result = tasks;

  if (filter?.status) {
    result = result.filter((task) => task.status === filter.status);
  }

  if (filter?.search) {
    const needle = filter.search.toLowerCase();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(needle) ||
        task.description.toLowerCase().includes(needle),
    );
  }

  if (filter?.tag) {
    result = result.filter((task) => task.tags.includes(filter.tag as string));
  }

  return [...result].sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) return byPriority;

    const aDue = a.dueDate ? Date.parse(a.dueDate) : Number.POSITIVE_INFINITY;
    const bDue = b.dueDate ? Date.parse(b.dueDate) : Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;

    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

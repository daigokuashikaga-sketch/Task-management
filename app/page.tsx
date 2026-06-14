import { TaskBoard } from "@/components/TaskBoard";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">タスク管理</h1>
        <p className="mt-1 text-sm text-slate-500">
          Next.js（App Router）＋ TypeScript ＋ SQLite で構築したフルスタックのタスク管理アプリ
        </p>
      </header>

      <TaskBoard />
    </main>
  );
}

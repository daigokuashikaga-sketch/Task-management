import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { TaskBoard } from "@/components/TaskBoard";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">タスク管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            Next.js（App Router）＋ TypeScript で構築したフルスタックのタスク管理アプリ
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-sm text-slate-600">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <TaskBoard />
    </main>
  );
}

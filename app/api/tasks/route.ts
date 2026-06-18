import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getTaskRepository } from "@/lib/db";
import { readJson, withRoute } from "@/lib/http";
import { createTaskSchema, taskFilterSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tasks?status=&search=&tag= — ログインユーザーのタスク一覧 */
export const GET = withRoute(async (request) => {
  const userId = await requireUserId();

  const { searchParams } = new URL(request.url);
  const parsed = taskFilterSchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const repo = await getTaskRepository();
  const tasks = await repo.list(userId, parsed.data);
  return NextResponse.json({ tasks });
});

/** POST /api/tasks — タスクの新規作成 */
export const POST = withRoute(async (request, _ctx, { log }) => {
  const userId = await requireUserId();
  const body = await readJson(request);

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const repo = await getTaskRepository();
  const task = await repo.create(userId, parsed.data);
  log.info("task.created", { userId, taskId: task.id });
  return NextResponse.json({ task }, { status: 201 });
});

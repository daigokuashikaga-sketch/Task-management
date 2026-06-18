import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getTaskRepository } from "@/lib/db";
import { readJson, withRoute } from "@/lib/http";
import { updateTaskSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

const notFound = () =>
  NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });

/** GET /api/tasks/:id — 単一タスクの取得（所有者のみ） */
export const GET = withRoute<RouteContext>(async (_request, { params }) => {
  const userId = await requireUserId();
  const repo = await getTaskRepository();
  const task = await repo.get(userId, params.id);
  return task ? NextResponse.json({ task }) : notFound();
});

/** PATCH /api/tasks/:id — タスクの部分更新（所有者のみ） */
export const PATCH = withRoute<RouteContext>(
  async (request, { params }, { log }) => {
    const userId = await requireUserId();
    const body = await readJson(request);

    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const repo = await getTaskRepository();
    const task = await repo.update(userId, params.id, parsed.data);
    if (!task) return notFound();
    log.info("task.updated", { userId, taskId: params.id });
    return NextResponse.json({ task });
  },
);

/** DELETE /api/tasks/:id — タスクの削除（所有者のみ） */
export const DELETE = withRoute<RouteContext>(
  async (_request, { params }, { log }) => {
    const userId = await requireUserId();
    const repo = await getTaskRepository();
    const deleted = await repo.delete(userId, params.id);
    if (!deleted) return notFound();
    log.info("task.deleted", { userId, taskId: params.id });
    return new NextResponse(null, { status: 204 });
  },
);

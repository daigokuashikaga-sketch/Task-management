import { NextResponse } from "next/server";
import { getTaskRepository } from "@/lib/db";
import { updateTaskSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

/** GET /api/tasks/:id — 単一タスクの取得 */
export async function GET(_request: Request, { params }: RouteContext) {
  const task = getTaskRepository().get(params.id);
  if (!task) {
    return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ task });
}

/** PATCH /api/tasks/:id — タスクの部分更新 */
export async function PATCH(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON を解析できません" }, { status: 400 });
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const task = getTaskRepository().update(params.id, parsed.data);
  if (!task) {
    return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ task });
}

/** DELETE /api/tasks/:id — タスクの削除 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const deleted = getTaskRepository().delete(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}

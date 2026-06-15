import { NextResponse } from "next/server";
import { getTaskRepository } from "@/lib/db";
import { createTaskSchema, taskFilterSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/tasks?status=&search= — タスク一覧の取得 */
export async function GET(request: Request) {
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

  const tasks = getTaskRepository().list(parsed.data);
  return NextResponse.json({ tasks });
}

/** POST /api/tasks — タスクの新規作成 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON を解析できません" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const task = getTaskRepository().create(parsed.data);
  return NextResponse.json({ task }, { status: 201 });
}

import { NextResponse } from "next/server";
import { getUserRepository } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { RateLimiter, clientIp } from "@/lib/rate-limit";
import { DuplicateEmailError, toPublicUser } from "@/lib/user-repository";
import { registerSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 同一 IP からの登録連打（スパム・列挙）を抑止する。
const limiter = new RateLimiter(
  Number(process.env.RATE_LIMIT_REGISTER ?? 20),
  60_000,
);

/** POST /api/auth/register — メール＋パスワードでの新規ユーザー登録 */
export async function POST(request: Request) {
  const verdict = limiter.check(clientIp(request));
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくして再試行してください" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((verdict.resetAt - Date.now()) / 1000)),
          ),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON を解析できません" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const user = await getUserRepository().create({
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      passwordHash,
    });
    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

import { NextResponse } from "next/server";
import { activeDriver, checkDatabase } from "@/lib/db";
import { withRoute } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — 稼働確認（ロードバランサ / 監視用）。
 * DB 疎通に成功すれば 200、失敗すれば 503 を返す。認証不要。
 */
export const GET = withRoute(async (_request, _ctx, { log }) => {
  try {
    await checkDatabase();
    return NextResponse.json({
      status: "ok",
      driver: activeDriver(),
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("health.db_unreachable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { status: "error", driver: activeDriver() },
      { status: 503 },
    );
  }
});

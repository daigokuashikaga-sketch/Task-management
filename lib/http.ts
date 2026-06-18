import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { UnauthorizedError } from "./auth/constants";
import { logger, type Logger } from "./logger";

/** 想定済みのクライアントエラー。status と公開メッセージを持つ。 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** JSON ボディを読む。壊れていれば 400 を投げる。 */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "JSON を解析できません");
  }
}

export interface RequestMeta {
  requestId: string;
  log: Logger;
}

export type RouteHandler<Ctx> = (
  request: Request,
  context: Ctx,
  meta: RequestMeta,
) => Promise<Response> | Response;

/**
 * Route Handler 共通ラッパー。
 * - リクエスト ID を採番（既存の x-request-id があれば引き継ぐ）し応答に付与
 * - 開始/完了/失敗を構造化ログに記録（method・path・status・所要時間）
 * - 例外を集約: UnauthorizedError→401 / HttpError→指定 status / それ以外→500
 *   （想定外エラーの詳細はサーバーログのみ。応答には requestId だけを返す）
 */
export function withRoute<Ctx = unknown>(handler: RouteHandler<Ctx>) {
  // context は Next ランタイムが渡す（直接呼び出すテストでは省略可）。
  return async (request: Request, context?: Ctx): Promise<Response> => {
    const requestId = request.headers.get("x-request-id") ?? randomUUID();
    const { pathname } = new URL(request.url);
    const log = logger.child({ requestId, method: request.method, path: pathname });
    const start = Date.now();

    const finish = (res: Response): Response => {
      res.headers.set("x-request-id", requestId);
      return res;
    };

    try {
      const res = await handler(request, context as Ctx, { requestId, log });
      log.info("request.complete", {
        status: res.status,
        durationMs: Date.now() - start,
      });
      return finish(res);
    } catch (error) {
      const durationMs = Date.now() - start;

      if (error instanceof UnauthorizedError) {
        log.warn("request.unauthorized", { status: 401, durationMs });
        return finish(
          NextResponse.json({ error: error.message, requestId }, { status: 401 }),
        );
      }

      if (error instanceof HttpError) {
        log.warn("request.rejected", {
          status: error.status,
          durationMs,
          reason: error.message,
        });
        return finish(
          NextResponse.json(
            { error: error.message, requestId },
            { status: error.status },
          ),
        );
      }

      log.error("request.error", {
        status: 500,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return finish(
        NextResponse.json(
          { error: "内部エラーが発生しました", requestId },
          { status: 500 },
        ),
      );
    }
  };
}

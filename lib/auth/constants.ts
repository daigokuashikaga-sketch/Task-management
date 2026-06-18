/**
 * 認証まわりの定数・例外（next-auth に依存しないリーフモジュール）。
 *
 * 永続化層やテスト環境など、リクエストコンテキストの無い場所からも
 * 安全に import できるよう、ここには next-auth を持ち込まない。
 */

/**
 * 認証導入前（Phase 0）に作成された JSON データの ownerId 欠落を補完するための既定値。
 * 後方互換のためだけに残している。新規データには実ユーザー ID が入る。
 */
export const DEMO_USER_ID = "demo-user";

/** 認証が必要な操作で未認証だった場合に投げる例外（API では 401 へ変換）。 */
export class UnauthorizedError extends Error {
  constructor(message = "認証が必要です") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

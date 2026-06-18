/**
 * 認証シーム（テナント ID の単一の出所）。
 *
 * アプリ層は「現在のユーザー ID」をこのモジュール経由でのみ取得する。
 * これにより、認証方式（Phase 1 で Auth.js を導入予定）が変わっても
 * API ルートやリポジトリ呼び出し側のコードは影響を受けない。
 *
 * 【Phase 0 の暫定実装】
 * 認証導入前のため、すべてのリクエストを単一のデモユーザーに解決する。
 * Phase 1 で requireUserId() の本体を Auth.js のセッション参照に差し替え、
 * 未認証時は UnauthorizedError を投げるようにする。
 */

/** Phase 0 の暫定テナント。認証導入時に実ユーザーへ置き換える。 */
export const DEMO_USER_ID = "demo-user";

/** 認証が必要な操作で未認証だった場合に投げる例外（Phase 1 で 401 へ変換）。 */
export class UnauthorizedError extends Error {
  constructor(message = "認証が必要です") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * 現在のリクエストの認証済みユーザー ID を返す。
 * Phase 0 では常にデモユーザーを返す（認証は Phase 1 で導入）。
 */
export async function requireUserId(): Promise<string> {
  return DEMO_USER_ID;
}

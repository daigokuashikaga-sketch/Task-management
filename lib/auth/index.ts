import NextAuth from "next-auth";
import { authConfig } from "./config";
import { UnauthorizedError } from "./constants";

/**
 * 認証のエントリポイント。
 * NextAuth インスタンスを生成し、ハンドラ・セッション取得関数を公開する。
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export { UnauthorizedError, DEMO_USER_ID } from "./constants";

/**
 * 現在のリクエストの認証済みユーザー ID を返す。
 * 未認証なら UnauthorizedError を投げる（API 境界で 401 へ変換）。
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new UnauthorizedError();
  return id;
}

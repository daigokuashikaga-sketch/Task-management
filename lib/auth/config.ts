import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getUserRepository } from "../db";
import { verifyPassword } from "../password";
import {
  normalizeEmail,
  toPublicUser,
  type PublicUser,
  type UserRepository,
} from "../user-repository";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * メール＋パスワードを検証し、成功時のみ公開ユーザーを返す。
 * next-auth のランタイムから切り離した純粋関数とし、単体テストを可能にする。
 * 失敗理由（ユーザー不在 / パスワード不一致）は呼び出し側へ漏らさない（列挙攻撃対策）。
 *
 * @param users テスト時に差し替え可能なユーザーストア（既定は実リポジトリ）。
 */
export async function authorizeCredentials(
  raw: unknown,
  users: UserRepository = getUserRepository(),
): Promise<PublicUser | null> {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;

  const user = await users.findByEmail(normalizeEmail(parsed.data.email));
  if (!user) return null;

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return null;

  return toPublicUser(user);
}

/**
 * Auth.js 設定。
 * - Credentials プロバイダのため、セッションは JWT 戦略（DB セッションは Phase 2 で検討）。
 * - secret は環境変数 AUTH_SECRET から取得（コードにハードコードしない）。
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials) => authorizeCredentials(credentials),
    }),
  ],
  callbacks: {
    // Credentials + JWT 戦略では sub クレームに authorize が返した user.id が入る。
    // それをセッションへ写し、テナントスコープに使う。
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

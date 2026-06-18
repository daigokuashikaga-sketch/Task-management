import type { DefaultSession } from "next-auth";

/**
 * next-auth の型拡張。
 * セッションのユーザーに ID を持たせ、テナントスコープに利用する。
 * （ユーザー ID は JWT の sub クレームから session へ写す。config.ts 参照）
 */
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

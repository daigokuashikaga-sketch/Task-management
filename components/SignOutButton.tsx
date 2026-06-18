"use client";

import { signOut } from "next-auth/react";

/** サインアウトしてログイン画面へ遷移するボタン。 */
export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: "/login" })}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
    >
      サインアウト
    </button>
  );
}

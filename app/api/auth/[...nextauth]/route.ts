import { handlers } from "@/lib/auth";

// scrypt による検証など Node API を使うため Node ランタイムで動かす。
export const runtime = "nodejs";

export const { GET, POST } = handlers;

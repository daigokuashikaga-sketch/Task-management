/**
 * 軽量な固定ウィンドウ・レートリミッタ（プロセス内メモリ）。
 *
 * 単一インスタンスでの濫用抑止には十分だが、サーバーレスや複数インスタンスでは
 * インスタンスごとに状態が分かれる。本番でグローバルに効かせる場合は
 * Redis / Upstash 等の共有ストアへ差し替える前提（インターフェースは同一）。
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface Window {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** key（多くは IP）について 1 回分を加算し、許可可否を返す。 */
  check(key: string, now: number = Date.now()): RateLimitResult {
    const current = this.windows.get(key);

    if (!current || now >= current.resetAt) {
      const resetAt = now + this.windowMs;
      this.windows.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.limit - 1, resetAt };
    }

    if (current.count >= this.limit) {
      return { allowed: false, remaining: 0, resetAt: current.resetAt };
    }

    current.count += 1;
    return {
      allowed: true,
      remaining: this.limit - current.count,
      resetAt: current.resetAt,
    };
  }

  /** テスト用などに内部状態を破棄する。 */
  reset(): void {
    this.windows.clear();
  }
}

/** プロキシ経由を考慮してクライアント IP を推定する。 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

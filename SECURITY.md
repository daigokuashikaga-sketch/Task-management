# セキュリティポリシー

## 脆弱性の報告

セキュリティ上の問題は **公開 Issue にせず**、GitHub の
[Private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
（リポジトリの **Security → Report a vulnerability**）からご連絡ください。
原則 72 時間以内に一次返信します。

## 実装済みの対策

| 領域 | 対策 |
| --- | --- |
| 認証 | Auth.js (NextAuth v5)。パスワードは `scrypt` でソルト付きハッシュ化（平文・可逆保存なし） |
| マルチテナント | 全データ操作を `ownerId` でスコープ。Postgres では FK + アプリ層の二重防御。契約テストで他テナント参照不可を検証 |
| HTTP ヘッダ | CSP / HSTS / X-Frame-Options(DENY) / X-Content-Type-Options(nosniff) / Referrer-Policy / Permissions-Policy（`next.config.mjs`） |
| 入力検証 | 全 API 入力を Zod で検証。登録メールは正規化し一意制約で重複排除 |
| レート制限 | 登録エンドポイントに IP 単位の制限（`lib/rate-limit.ts`） |
| 機密情報 | `.env*` は Git 管理外。`AUTH_SECRET` 等は環境変数。CI で gitleaks による履歴走査 |
| 依存・コード | Dependabot（npm / actions）、CodeQL（security-and-quality）、Dependency Review、`npm audit` を CI に組込 |

## 既知の課題（追跡中）

- **Next.js のアドバイザリ**: 現行 `next@14.2.35` は 14.x 系の最新パッチだが、
  `npm audit` で報告される複数のアドバイザリ（XSS / キャッシュポイズニング /
  画像最適化 API の DoS / SSRF 等）の完全解消には **Next 16 への更新（破壊的変更）** が必要。
  - 緩和: 当アプリは画像最適化 API・i18n ミドルウェア・`beforeInteractive`
    スクリプトを使用しておらず、API は Node ランタイム固定。該当する攻撃面は限定的。
  - 対応方針: Next 16 への更新は独立タスクとして計画し、App Router / Auth.js の
    互換確認と E2E 通過を条件に実施する。

## スコープ外（本番運用時の前提）

- レート制限はプロセス内メモリ実装。複数インスタンスで一貫させる場合は
  Redis / Upstash 等の共有ストアへ差し替える。
- ノンスベースの厳格 CSP（`'unsafe-inline'` 排除）はミドルウェア導入時の改善候補。

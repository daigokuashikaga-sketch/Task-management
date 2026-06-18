# アーキテクチャ

## 全体像

3 層構成で、各層は下位の**インターフェース**にのみ依存する。

```
UI（Server/Client Components）
        │  fetch
API（Route Handlers ＋ withRoute ラッパー）
        │  TaskRepository / UserRepository
永続化（postgres / json / memory ドライバ）
```

横断的関心事はラッパー・ユーティリティに集約している。

- 認証・認可: `lib/auth/*`（Auth.js）＋ `requireUserId()`
- リクエスト境界: `lib/http.ts`（requestId 採番・構造化ログ・例外集約）
- 入力検証: `lib/validation.ts`（Zod）
- 観測性: `lib/logger.ts`
- 濫用防止: `lib/rate-limit.ts`

## データモデル

- `users`: id / email(unique) / name / passwordHash / createdAt
- `tasks`: id / **ownerId(FK→users.id, CASCADE)** / title / description / status / priority / tags(jsonb) / dueDate / createdAt / updatedAt
- 索引: `tasks.owner_id`, `tasks.status`

日時はドメイン（ISO 8601 文字列）に合わせ全ドライバで `text` 保持し、挙動を揃えている。

---

## 意思決定記録（ADR）

### ADR-001: リポジトリパターンによる依存性逆転
**背景**: ローカルは手軽さ、本番は堅牢さが欲しく、テストは高速・隔離が必要。
**決定**: `TaskRepository` / `UserRepository` インターフェースを定義し、postgres / json / memory の実装を差し替え可能にする。検索・並び替えは `applyFilter` に一元化。
**帰結**: 同一の契約テストが全ドライバに通用。上位レイヤーはストレージ非依存。

### ADR-002: ドライバの自動選択
**決定**: `DB_DRIVER` > `DATABASE_URL`(postgres) > `VERCEL`(memory) > json の優先順位で選択。
**帰結**: ローカルは設定ゼロ、本番は `DATABASE_URL` を置くだけ、Vercel デモは無設定で動作。

### ADR-003: Auth.js（NextAuth v5）＋ Credentials
**背景**: 自前のセッション管理は事故りやすい。
**決定**: Auth.js の JWT セッション＋ Credentials プロバイダ。パスワードは Node 標準の `scrypt` でソルト付きハッシュ化（外部依存を増やさない）。
**帰結**: 標準的で監査しやすい認証。OAuth 追加も容易。

### ADR-004: マルチテナント分離をアプリ層＋DB層の二重で担保
**決定**: 全操作を `ownerId` でスコープし、Postgres では FK 制約も付与。
**帰結**: 単一バグでの越境を防ぐ多層防御。契約テストで他テナント参照不可を保証。

### ADR-005: Drizzle ORM ＋ 生成マイグレーション
**決定**: 型安全なクエリビルダと、`drizzle-kit` による SQL マイグレーションを採用。
**帰結**: スキーマと型が単一情報源。マイグレーションはレビュー可能な SQL として版管理。

### ADR-006: PGlite による Postgres 契約テスト
**背景**: 本番と同じ SQL 挙動をサーバーなしで検証したい。
**決定**: テストはインプロセス Postgres（PGlite）に生成済みマイグレーションを適用して実行。
**帰結**: FK・一意制約・テナント分離を**実 SQL**で検証。CI に外部 DB 不要。

### ADR-007: Route 共通ラッパーで横断的関心事を集約
**決定**: `withRoute` で requestId・ログ・例外→ステータス変換を一元化。
**帰結**: 各ハンドラは本質に集中。内部エラー詳細の漏えいを防ぎ、`requestId` で追跡可能。

### ADR-008: 構造化ログ（依存ゼロ）
**決定**: 本番は 1 行 JSON、開発は整形。`LOG_LEVEL` で制御。
**帰結**: ログ収集基盤に載せやすく、依存も増やさない。

## 既知の制約・今後

- レート制限はプロセス内メモリ。複数インスタンスでは共有ストア（Redis/Upstash）へ。
- Next.js は 14.x 最新。アドバイザリ完全解消には Next 16 移行（別タスク, `SECURITY.md`）。
- UI コンポーネントの単体テストは今後の課題（現状は API 結合＋E2E で担保）。
- 一覧は所有者単位で取得後にフィルタ。大規模化時は SQL 側ページング/絞り込みへ。

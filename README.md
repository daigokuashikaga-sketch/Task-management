# Task Management

![CI](https://github.com/daigokuashikaga-sketch/Task-management/actions/workflows/ci.yml/badge.svg)
![E2E](https://github.com/daigokuashikaga-sketch/Task-management/actions/workflows/e2e.yml/badge.svg)
![CodeQL](https://github.com/daigokuashikaga-sketch/Task-management/actions/workflows/codeql.yml/badge.svg)

Next.js（App Router）＋ TypeScript で構築した、**マルチテナント対応のフルスタック・タスク管理アプリケーション**です。
動くものを作るだけでなく、**認証・本番データベース・セキュリティ・観測性・テスト**まで、
実運用に耐える品質を意識して設計しています。

---

## 主な機能

- メール＋パスワードによる**ユーザー登録・認証**（Auth.js v5）
- **ユーザーごとに隔離されたタスク管理**（マルチテナント）
- タスクの作成・**インライン編集**・削除（CRUD）
- ステータス管理（未着手 / 進行中 / 完了）と**ドラッグ＆ドロップのカンバンボード**、リスト／ボードの表示切替
- **タグ付け**とクリック絞り込み、優先度（高 / 中 / 低）・期限の設定と**期限超過ハイライト**
- タイトル・説明の**インクリメンタル検索**（デバウンス）、ステータス別タブと件数サマリー
- 優先度 → 期限 → 作成日時を考慮した並び替え

## 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| フレームワーク | Next.js 14（App Router / Route Handlers） |
| 言語 | TypeScript（strict） |
| 認証 | Auth.js（NextAuth v5, Credentials）+ `scrypt` ハッシュ |
| 永続化 | Postgres + Drizzle ORM（本番）／ JSON ファイル（ローカル既定）／ インメモリ（デモ・テスト） |
| 入力検証 | Zod |
| スタイリング | Tailwind CSS |
| テスト | Vitest（単体・契約・結合）＋ PGlite ＋ Playwright（E2E） |
| 観測性 | 構造化ログ・リクエスト ID・`/api/health` |
| CI/CD | GitHub Actions・CodeQL・Dependabot・gitleaks |

## アーキテクチャ

UI・API・永続化を疎結合に保つため、**リポジトリパターンによる依存性逆転**を採用しています。
上位レイヤーは具体的なストレージではなく `TaskRepository` / `UserRepository` インターフェースに依存し、
ドライバを差し替えても影響を受けません。詳細は [`ARCHITECTURE.md`](./ARCHITECTURE.md) を参照。

```
app/
  page.tsx                    画面シェル（Server Component, 未認証は /login へ）
  login / register            認証画面（Client Component）
  api/
    auth/[...nextauth]        Auth.js ハンドラ
    auth/register             ユーザー登録（レート制限付き）
    tasks, tasks/[id]         タスク CRUD（要認証・所有者スコープ）
    health                    ヘルスチェック
components/                   UI（TaskBoard / KanbanBoard / TaskForm / TaskItem / Filters …）
lib/
  types.ts                    ドメイン型（単一情報源）
  validation.ts               Zod 入力検証
  repository.ts               TaskRepository I/F ＋ 共通の検索/並び替え（applyFilter）
  user-repository.ts          UserRepository I/F
  {json,memory,postgres}-repository.ts   各ドライバ実装
  schema.ts                   Drizzle スキーマ（users / tasks, FK・索引）
  db.ts                       ドライバ選択とシングルトン管理
  auth/                       Auth.js 設定・認可・定数
  http.ts                     Route 共通ラッパー（requestId・ログ・エラー集約）
  logger.ts                   構造化ロガー
  rate-limit.ts               レートリミッタ
drizzle/                      生成済みマイグレーション
e2e/                          Playwright スモーク
```

### 永続化ドライバ

| ドライバ | 用途 | 選択条件 |
| --- | --- | --- |
| `postgres` | 本番（Drizzle ORM + マイグレーション） | `DATABASE_URL` 設定時、または `DB_DRIVER=postgres` |
| `json` | ローカル開発（依存ゼロで永続化） | 既定 |
| `memory` | デモ・テスト（再起動で消える＋サンプル投入） | Vercel など、または `DB_DRIVER=memory` |

選択優先順位: **`DB_DRIVER` > `DATABASE_URL`（postgres）> Vercel（memory）> json**。
同一インターフェースを満たすため、**契約テストが全ドライバに通用**します（Postgres は PGlite で実検証）。

### マルチテナント

すべてのデータ操作を `ownerId` でスコープし、他ユーザーのデータには一切アクセスできません。
Postgres では `tasks.owner_id → users.id` の外部キー（CASCADE）でも整合性を担保します。

## API

| メソッド | パス | 認証 | 説明 |
| --- | --- | :--: | --- |
| POST | `/api/auth/register` | – | ユーザー登録（レート制限） |
| GET | `/api/tasks?status=&search=&tag=` | ✓ | タスク一覧（絞り込み・検索・タグ） |
| POST | `/api/tasks` | ✓ | タスク作成 |
| GET | `/api/tasks/:id` | ✓ | 単一タスク取得 |
| PATCH | `/api/tasks/:id` | ✓ | タスク部分更新 |
| DELETE | `/api/tasks/:id` | ✓ | タスク削除 |
| GET | `/api/health` | – | 稼働確認（DB 疎通） |

不正入力は `400`、未認証は `401`、対象なし/他人のデータは `404` を返します。
全応答に `x-request-id` を付与します。

## セットアップ

```bash
npm install
cp .env.example .env          # AUTH_SECRET を設定（openssl rand -base64 32）
npm run dev                   # http://localhost:3000
```

> Node.js 18 以上。既定は JSON ファイル永続化のため追加ツール不要です。

### Postgres（本番）

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db"
npm run db:generate           # スキーマからマイグレーション生成（変更時）
npm run db:migrate            # マイグレーション適用
npm run build && npm run start
```

環境変数の一覧は [`.env.example`](./.env.example) を参照。

### スクリプト

```bash
npm run dev           # 開発サーバー
npm run build/start   # 本番ビルド / 起動
npm run typecheck     # 型チェック
npm run lint          # Lint
npm run test          # テスト（Vitest）
npm run test:coverage # カバレッジ（しきい値 80%）
npm run test:e2e      # E2E（要 test:e2e:install）
npm run db:generate   # Drizzle マイグレーション生成
npm run db:migrate    # マイグレーション適用
```

## テスト

単体・契約（PGlite で実 Postgres）・結合（API 境界）・E2E（Playwright）の多層構成で、
カバレッジしきい値 80% を CI で強制しています。詳細は [`TESTING.md`](./TESTING.md)。

## セキュリティ

CSP / HSTS などのセキュリティヘッダ、登録 API のレート制限、`scrypt` による
パスワードハッシュ、テナント分離、CodeQL / gitleaks / Dependabot を導入しています。
方針と既知の課題は [`SECURITY.md`](./SECURITY.md)。

## デプロイ

- **Vercel**: `DATABASE_URL` を設定すれば Postgres、未設定ならインメモリのデモとして動作。

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/daigokuashikaga-sketch/Task-management)

- **Docker**: スタンドアロン出力でポータブルに起動できます。

  ```bash
  docker build -t task-management .
  docker run -p 3000:3000 -e AUTH_SECRET=... -e DATABASE_URL=... task-management
  ```

`/api/health` をロードバランサ／監視のヘルスチェックに利用できます。

## CI/CD

GitHub Actions で push / PR ごとに **型チェック → Lint → テスト（カバレッジ）→ ビルド → 監査**、
別ジョブで **E2E**、加えて **CodeQL / gitleaks / Dependency Review** を実行します。

## ドキュメント

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — 設計判断と意思決定記録（ADR）
- [`TESTING.md`](./TESTING.md) — テスト戦略
- [`SECURITY.md`](./SECURITY.md) — セキュリティ方針
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — 開発フロー・規約

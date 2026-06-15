# Task Management

![CI](https://github.com/daigokuashikaga-sketch/Task-management/actions/workflows/ci.yml/badge.svg)

Next.js（App Router）＋ TypeScript で構築した、フルスタックのタスク管理アプリケーションです。
「動くものを作る」だけでなく、**保守しやすい設計・型安全・テスト容易性**を意識して実装しています。

> **ライブデモ**: Vercel にワンクリックでデプロイできます（下記「デモ / デプロイ」参照）。

---

## 主な機能

- タスクの作成・**インライン編集**・削除（CRUD）
- ステータス管理（未着手 / 進行中 / 完了）
- **ドラッグ＆ドロップのカンバンボード**（カードを列へドラッグして状態変更）と**リスト／ボードの表示切替**
- **タグ付け**と、タグをクリックしての絞り込み
- 優先度（高 / 中 / 低）と期限の設定、**期限超過の自動ハイライト**
- ステータス別のタブ絞り込み
- タイトル・説明の**インクリメンタル検索**（デバウンス付き）
- ステータス別の件数サマリー
- 優先度 → 期限 → 作成日時を考慮した並び替え

## デモ / デプロイ

サーバーレス（Vercel）では、ファイル書き込みができないため**自動でインメモリ＋サンプルデータ**に切り替わり、追加設定なしで動作します（ローカルでは JSON ファイルに永続化）。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/daigokuashikaga-sketch/Task-management)

上のボタン、または以下の CLI でデプロイできます。

```bash
npm i -g vercel
vercel        # プレビューデプロイ
vercel --prod # 本番デプロイ
```

## スクリーンショット

ローカル起動後、同梱の Playwright スクリプトで撮影できます（`docs/screenshots/` に出力）。

```bash
DB_DRIVER=memory npm run dev          # 別ターミナルでサンプルデータ入り起動
npm i -D playwright && npx playwright install chromium
node scripts/screenshot.mjs
```

## 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| フレームワーク | Next.js 14（App Router / Route Handlers） |
| 言語 | TypeScript（strict モード） |
| 永続化 | JSON ファイル（既定・依存ゼロ）／ SQLite（任意・better-sqlite3） |
| 入力検証 | Zod |
| スタイリング | Tailwind CSS |
| テスト | Vitest |

## アーキテクチャ

UI・API・永続化を疎結合に保つため、**リポジトリパターンによる依存性逆転**を採用しています。
アプリ本体は具体的なストレージ実装ではなく `TaskRepository` インターフェースに依存するため、
ストレージを差し替えても上位レイヤーに影響しません。

```
app/
  page.tsx                  画面シェル（Server Component）
  api/tasks/route.ts        GET 一覧 / POST 作成
  api/tasks/[id]/route.ts   GET / PATCH / DELETE
components/                 UI（Client Component）
  TaskBoard                 一覧/ボードの統括・状態管理
  KanbanBoard               ドラッグ＆ドロップのカンバン
  TaskForm / TaskItem / Filters
lib/
  types.ts                  ドメイン型（共通の語彙）
  validation.ts             Zod による入力検証スキーマ
  tags.ts                   タグ入力のパース/整形
  repository.ts             TaskRepository インターフェース＋共通の検索/並び替え
  json-repository.ts        JSON ファイル実装（既定・依存ゼロ）
  sqlite-repository.ts      SQLite 実装（任意）
  memory-repository.ts      インメモリ実装（テスト・デモ）
  db.ts                     リポジトリのシングルトン（環境に応じて実装を選択）
  client.ts                 クライアント側 API ラッパー
```

### 設計上の意図

- **依存性逆転**: 既定は依存ゼロの JSON ファイル実装、テスト時はインメモリ実装、任意で SQLite 実装に差し替え可能。同一インターフェースを満たすため契約テストがそのまま全実装に通用します。ネイティブビルドなしで `npm install` だけ動くことを優先しています。
- **境界での入力検証**: 外部入力は必ず Zod スキーマを通し、不正なデータがドメイン／永続化層へ流れ込むのを防ぎます。
- **ロジックの一元化**: 検索・並び替えは `applyFilter` に集約し、実装間での挙動のブレを排除。
- **型の単一情報源**: ステータスや優先度を `as const` 配列から導出し、型・UI ラベル・バリデーションを 1 か所で管理。

## API

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/tasks?status=&search=&tag=` | タスク一覧（絞り込み・検索・タグ） |
| POST | `/api/tasks` | タスク作成 |
| GET | `/api/tasks/:id` | 単一タスク取得 |
| PATCH | `/api/tasks/:id` | タスク部分更新 |
| DELETE | `/api/tasks/:id` | タスク削除 |

不正入力は `400`、対象なしは `404` を返します。

## セットアップ

```bash
npm install        # 依存関係のインストール（ネイティブビルド不要）
npm run dev        # 開発サーバー起動（http://localhost:3000）
```

> Node.js 18 以上が必要です。既定の永続化は JSON ファイルなので、コンパイラや追加ツールは不要です。

その他のコマンド:

```bash
npm run build      # 本番ビルド
npm run start      # 本番サーバー起動
npm run typecheck  # 型チェック（tsc --noEmit）
npm run test       # テスト（Vitest）
npm run lint       # Lint（next lint）
```

データは既定で `data/tasks.json` に保存されます。`DATABASE_PATH` で保存先を変更できます。

SQLite を使いたい場合は、better-sqlite3 を導入し `DB_DRIVER=sqlite` を指定します（任意）:

```bash
npm install better-sqlite3
DB_DRIVER=sqlite npm run dev   # data/tasks.db に保存
```

## テスト

Vitest で以下を検証しています（計 25 件）。

- リポジトリの振る舞い（CRUD・絞り込み・検索・タグ・並び替え）
- JSON ファイル実装の永続化（再起動後のデータ復元）
- タグ入力のパース（重複除去・トリム）
- Zod バリデーション
- **Route Handler の結合テスト**（API 境界のステータスコード・永続化）

```bash
npm run test
```

## CI

GitHub Actions（`.github/workflows/ci.yml`）で、push / PR ごとに
**型チェック → Lint → テスト → ビルド**を自動実行しています。

## 今後の拡張余地

- 認証によるユーザーごとのタスク管理
- Vercel KV / Postgres など永続ストアへの差し替え（リポジトリ実装の追加のみで対応可能）
- 楽観的更新による体感速度の向上
- 並び替え順のカスタマイズ

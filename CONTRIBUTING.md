# コントリビューションガイド

## 開発環境

```bash
npm install
cp .env.example .env   # AUTH_SECRET を設定
npm run dev
```

Node.js 18 以上。既定は JSON ドライバのため追加ツール不要。

## ブランチ / コミット

- `main` への直接 push は不可。feature ブランチで作業し PR を出す。
- コミットメッセージは「何を・なぜ」を簡潔に。1 コミット 1 関心事を目安に。

## 提出前チェック（すべて緑必須）

```bash
npm run typecheck
npm run lint
npm run test:coverage   # カバレッジしきい値 80%
npm run build
```

E2E を変更した場合:

```bash
npm run test:e2e:install   # 初回のみ
npm run test:e2e
```

## コーディング規約

- **型安全**: `any` を避け、ドメイン型（`lib/types.ts`）を単一情報源にする。
- **入力検証**: 外部入力は必ず Zod スキーマを通す。
- **データ操作**: 必ず `ownerId` でスコープする（テナント分離を壊さない）。
- **ロジックの一元化**: 検索・並び替えは `applyFilter` に集約する。
- **エラー処理**: 想定済みは `HttpError`、認可は `requireUserId()`。裸の `throw` で 500 を漏らさない。
- **コメント**: 周辺コードの粒度に合わせ、「なぜ」を中心に簡潔に（日本語）。

## 新しい永続化ドライバを足すには

1. `XxxTaskRepository` / `XxxUserRepository` を実装（既存インターフェース準拠）。
2. `lib/db.ts` の選択ロジックに追加。
3. 既存の契約テストを流用して挙動の同一性を検証。

## テストの追加

- ロジック → 単体（Vitest）
- リポジトリ → 契約テスト（全ドライバ共通、Postgres は PGlite）
- API 挙動 → 結合テスト（Route Handler を直接呼ぶ）
- 画面導線 → E2E（Playwright, `e2e/`）

詳細は [`TESTING.md`](./TESTING.md) / [`ARCHITECTURE.md`](./ARCHITECTURE.md)。

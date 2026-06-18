# テスト戦略

多層でテストし、各層を CI のゲートにしている。

## 層

| 層 | ツール | 対象 | 実行 |
| --- | --- | --- | --- |
| 単体 | Vitest | ドメインロジック（フィルタ・タグ・バリデーション・パスワード・レート制限・ロガー） | `npm test` |
| 契約 | Vitest + PGlite | リポジトリ実装が共通インターフェースを満たすか（memory/json/**実 Postgres**） | `npm test` |
| 結合 | Vitest | Route Handler の API 境界（認証・認可・テナント分離・ステータス・永続化） | `npm test` |
| E2E | Playwright | ブラウザ越しの主要導線（登録→自動ログイン→タスク作成、未ログイン誘導、ヘルス） | `npm run test:e2e` |

## カバレッジ

- `npm run test:coverage` で計測。`vitest.config.ts` の **しきい値 80%**（statements / branches / functions / lines）を下回ると失敗する。
- 計測対象はロジック層（`lib/**`, `app/api/**`）。UI コンポーネントのテストは今後の課題。

## E2E の前提

Playwright はブラウザのダウンロードが必要なため、**ネットワーク制限のある一部サンドボックスでは
ローカル実行できない**。本リポジトリでは GitHub Actions（`.github/workflows/e2e.yml`）で
ブラウザを取得して実行する。ローカルで動かす場合は一度だけ:

```bash
npm run test:e2e:install   # Chromium を取得
npm run test:e2e
```

E2E はメモリドライバ + ダミー秘密で隔離起動するため、外部 DB を必要としない。

## CI ゲート

`.github/workflows/ci.yml`: typecheck → lint → test（カバレッジしきい値込み）→ build → `npm audit`（非ブロッキング）。
`.github/workflows/e2e.yml`: Playwright を別ジョブで実行。
そのほか CodeQL / gitleaks / Dependency Review / Dependabot を併用（`SECURITY.md` 参照）。

# 実装タスク・進捗管理

`plans/implementation-plan.md` をもとにしたタスク一覧と進捗・実装記録。

- ステータス凡例: `[ ]` 未着手 / `[~]` 進行中 / `[x]` 完了 / `[!]` 保留・要確認
- 進捗の更新ルール: 着手時に `[~]`、完了時に `[x]` に変更し、下部「実装ログ」に1行追記する。
- 関連: 実装計画 → `plans/implementation-plan.md` / テストルール → `CLAUDE.md`

---

## 進捗サマリ

| フェーズ | 内容 | 状態 |
| --- | --- | --- |
| 1 | 基盤セットアップ | [x] |
| 2 | DB / ORM | [x] |
| 3 | 認証 | [x] |
| 4 | YouTube ユーティリティ + テスト | [x] |
| 5 | 管理機能 | [x] |
| 6 | 一覧 / 詳細（一般） | [x] |
| 7 | 共通 UI / デザイン | [x] |
| 8 | シード | [x] |
| 9 | 仕上げ | [x] |

---

## フェーズ 1: 基盤セットアップ

- [x] Next.js(App Router) + TypeScript を pnpm で初期化
- [x] ディレクトリ構成を作成（`src/app`, `src/components`, `src/lib`, `src/actions`, `tests`, `scripts`）
- [x] Lint / Format 設定（ESLint flat config）
- [x] Vitest 設定（`pnpm test` / `pnpm test:run`）
- [x] `.env.example` 雛形を作成

## フェーズ 2: DB / ORM

- [x] Drizzle ORM + `@libsql/client` 導入
- [x] スキーマ定義 `src/lib/db/schema.ts`（`videos`, `user_video_states` + Better Auth 標準テーブル）
- [x] `(user_id, video_id)` ユニーク制約
- [x] Drizzle クライアント `src/lib/db/index.ts`
- [x] マイグレーション生成（`drizzle/0000_*.sql`）・ローカル DB へ適用（6テーブル作成確認）

## フェーズ 3: 認証

- [x] Better Auth 設定 `src/lib/auth.ts`（Google Provider）
- [x] `/api/auth/[...all]/route.ts` マウント
- [x] auth ヘルパー `src/lib/auth-helpers.ts`（`getSession` / `requireUser` / `requireAdmin` / `isAdmin`）
- [x] `ADMIN_EMAIL` による管理者判定
- [x] `/login` 画面（Google ログイン → `/` 遷移）
- [x] 未ログイン時の保護ページリダイレクト（`/`・`/admin` → `/login` を実機確認）
- [x] 実際の Google ログイン疎通（OAuth クレデンシャル設定後、ローカルでログイン成功を確認）

## フェーズ 4: YouTube ユーティリティ + テスト

- [x] `src/lib/youtube.ts`（`extractVideoId` / `thumbnailUrl` / `embedUrl`）
- [x] `src/lib/rating.ts`（`averageRating` / `isHighRated`）
- [x] `tests/youtube.test.ts`（実装計画 §12.4〜§12.5 の全ケース）
- [x] `tests/rating.test.ts`（実装計画 §12.6 の全ケース）
- [x] `pnpm test` 全 26 ケース green（テスト仕様は変更せず実装側で対応）

## フェーズ 5: 管理機能

- [x] CRUD Server Actions（`createVideo` / `updateVideo` / `deleteVideo` / `getAdminVideoList` / `getCategories`）
- [x] 各 admin アクション冒頭で `requireAdmin()`
- [x] 管理画面 `/admin`（[Add Video] 常時表示、非公開含むカテゴリ別リスト）
- [x] 動画追加画面 `/admin/videos/new`（カテゴリ候補＋自由入力 / タイトル / URL / 公開切替 / Submit / Back）
- [x] 詳細管理画面 `/admin/videos/[id]`（カテゴリ・タイトル・公開非公開を編集 / Remove / Back / サムネ・登録日時表示）
- [x] `/admin/**` のサーバーガード（直接URL対策、リダイレクト確認）

## フェーズ 6: 一覧 / 詳細（一般）

- [x] `getVideoListForUser`（公開動画をカテゴリ別＋仮想カテゴリで整形）
- [x] 仮想カテゴリ「未視聴の動画」（自分基準）
- [x] 仮想カテゴリ「評価の高い動画」（全員平均 4.0 以上、SQL 集計）
- [x] 動画一覧画面 `/`（登録日時の降順）
- [x] 動画詳細画面 `/videos/[id]`（カテゴリ/タイトル/サムネ/登録日時/自分の評価、非公開は管理者のみ）
- [x] インライン再生（サムネ→iframe差し替え、`enablejsapi=1` / IFrame API）
- [x] 再生開始イベントで `markWatched` を一度だけ発火
- [x] 星評価（整数1〜5）`setRating`
- [x] [未視聴に戻す] `resetWatched` / [Back]

## フェーズ 7: 共通 UI / デザイン

- [x] 共通レイアウト + ヘッダー（サイドバーなし）
- [x] ヘッダーの「管理画面へ」ボタン（非管理者は警告トーストで遷移しない）
- [x] ユーザー表示 / ログアウト
- [x] ダークテーマ（シネマテーク調）、サムネカード（視聴済み・評価バッジ）、星 UI
- [x] レスポンシブ対応（グリッド・詳細2カラムのブレークポイント）
- [x] Skill 適用（frontend-design のデザイン方針）

## フェーズ 8: シード

- [x] `scripts/seed.ts`（`pnpm seed`、5件投入を確認）
- [x] サンプル動画を複数カテゴリ・一部非公開で投入
- [x] 登録動画はテスト用プレースホルダーのまま据え置き（差し替え不要と決定）
- [x] 高評価確認用の擬似評価は投入しない（実ユーザーが画面から評価して確認する方針で決定）

## フェーズ 9: 仕上げ

- [x] ビルド成功（`pnpm build`）・型チェック・Lint クリーン
- [x] 基本動作のスモーク確認（未認証リダイレクト / ログイン画面描画）
- [x] 認証込みの一連フロー実機確認（ログイン・再生・視聴済み自動記録・評価保存・未視聴に戻す・高評価カテゴリ・管理者フロー すべて確認済み）
- [x] アクセシビリティ / パフォーマンスの最終レビュー（web-design-guidelines 準拠: focus-visible・color-scheme・theme-color・フォーム属性・画像サイズ・placeholder `…` を改善）
- [x] `.env.example` 整備
- [x] Vercel デプロイ手順整備 → `docs/deployment.md`（Turso 作成 / Google OAuth / Vercel env / マイグレーション / 動作確認 / トラブルシューティング）

---

## 未決事項（実装計画 §16）

- [x] シードに登録する具体的な YouTube 動画 → 差し替え不要（テスト用プレースホルダーのまま）
- [x] 高評価確認用の擬似評価 → シードには入れない（実ユーザーが画面から評価して確認）
- [x] カテゴリの表示順 → 現状（登録日時降順での出現順）のままで確定
- [!] 本番ドメイン確定後の Google OAuth リダイレクトURI / `BETTER_AUTH_URL` 設定

---

## 実装ログ

作業を進めるごとに、日付・対象タスク・内容・結果を新しい順で追記する。

| 日付 | フェーズ/タスク | 内容 | 結果・備考 |
| --- | --- | --- | --- |
| 2026-06-09 | F9 | デプロイ手順を `docs/deployment.md` に整備（Turso/Google OAuth/Vercel env/マイグレーション） | フェーズ9完了。実装計画の全フェーズ完了 |
| 2026-06-09 | F9 | web-design-guidelines で UI レビューし改善（focus-visible / color-scheme / theme-color / form 属性 / 画像 width-height / placeholder `…`） | build/lint/test green |
| 2026-06-09 | F9 | 認証込み全機能を実機確認（視聴済み自動記録・評価保存・未視聴戻し・高評価カテゴリ・管理者フロー） | すべて ✅。カテゴリ表示順は現状で確定 |
| 2026-06-09 | F3/F9 | OAuth クレデンシャル設定後、ローカルで Google ログイン・シード動画の再生を実機確認 | 成功（視聴済み記録・評価・未視聴戻しは次回確認） |
| 2026-06-09 | F1〜F9 | 実装計画に基づき初回実装。基盤〜UI まで一通り構築 | build/test/lint green、未認証フローをスモーク確認 |
| 2026-06-09 | F4 | youtube/rating の純粋関数 + Vitest 26 ケース | 全 green（テスト仕様は不変） |
| 2026-06-09 | F2 | スキーマ定義・マイグレーション・ローカル DB 適用 | 6テーブル作成確認 |
| 2026-06-09 | F8 | シードスクリプト作成・実行 | プレースホルダー動画 5 件投入 |
| 2026-06-09 | - | タスク表 `plans/tasks.md` を作成（実装計画 §15 ベース） | 着手前 |

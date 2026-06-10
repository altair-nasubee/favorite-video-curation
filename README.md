# favorite-video-curation — Cinéthèque

お気に入りの YouTube 動画をカテゴリごとに登録し、再生・評価できる Web アプリ。
シネマテーク調のダークテーマで、自分だけの「プライベート試写室」をつくる。

🔗 **本番**: https://favorite-video-curation.vercel.app

---

## 主な機能

- **Google ログイン**（Better Auth）。ログインしたユーザーは全員が動画の閲覧・登録・管理を行える（管理者の区別なし）。
- **カテゴリ別の動画一覧** — サムネイルのグリッド表示。クリックで詳細へ。
- **自動で更新される仮想カテゴリ**
  - 「未視聴の動画」… ログインユーザーが未視聴の公開動画
  - 「評価の高い動画」… 全ユーザーの平均評価が ★4.0 以上の動画
- **インライン再生** — 詳細画面でサムネをクリックすると、その場で YouTube プレーヤーに切り替わって再生。
- **視聴済みの自動記録** — 再生を開始した時点で「視聴済み」になる（YouTube IFrame Player API 連携）。
- **★5段階評価**（ユーザーごとに保存）／**[未視聴に戻す]**。
- **動画の管理** — Add Video から登録、詳細管理で編集・削除。カテゴリは既存候補＋自由入力。
- **公開 / 非公開** — 非公開動画は一般一覧には出ず、管理画面にのみ表示。

---

## 画面構成

| パス | 画面 |
| --- | --- |
| `/login` | Google ログイン |
| `/` | 動画一覧（未視聴・高評価＋カテゴリ別） |
| `/videos/[id]` | 動画詳細（再生・評価・未視聴に戻す） |
| `/admin` | 管理画面（Add Video / カテゴリ別リスト） |
| `/admin/videos/new` | 動画追加 |
| `/admin/videos/[id]` | 詳細管理（編集 / Remove） |

---

## 技術スタック

| レイヤー | 採用技術 |
| --- | --- |
| フレームワーク | Next.js（App Router） / React 19 / TypeScript |
| バックエンド | Next.js Server Actions |
| データベース | Turso（libSQL / SQLite） + Drizzle ORM |
| 認証 | Better Auth（Google OAuth） |
| テスト | Vitest |
| パッケージ管理 / ホスティング | pnpm / Vercel |

設計・仕様は [`plans/implementation-plan.md`](plans/implementation-plan.md)、進捗ログは [`plans/tasks.md`](plans/tasks.md)、
本番デプロイ手順は [`docs/deployment.md`](docs/deployment.md) を参照。

---

## ローカル開発

前提: Node.js 18+ / pnpm（`corepack enable pnpm` で有効化）。

```bash
pnpm install

# 環境変数を用意（ローカルは file:./local.db でDBを完結できる）
cp .env.example .env
# .env を編集: TURSO_DATABASE_URL="file:./local.db" / TURSO_AUTH_TOKEN=""
#            BETTER_AUTH_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET を設定

# スキーマをローカルDBへ適用（drizzle のマイグレーションを使用）
pnpm db:generate            # スキーマからマイグレーション生成（変更時のみ）
pnpm db:migrate             # 本番(Turso)へ適用。ローカル file: では下記 seed 前に一度適用

# 動作確認用のサンプル動画を投入（任意・ローカル専用）
pnpm seed

pnpm dev                    # http://localhost:3000
```

> **注意**: `pnpm seed` は `videos` テーブルを全削除してから入れ直す。`.env` の接続先が
> 本番（`libsql://…turso.io`）を指したまま実行すると本番データが消えるため、必ず
> `file:./local.db` を指していることを確認してから実行する。

### Google OAuth

[Google Cloud Console](https://console.cloud.google.com/) で OAuth クライアントを作成し、
リダイレクト URI に `http://localhost:3000/api/auth/callback/google`（本番は本番ドメイン）を登録。
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を `.env` に設定する。

---

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 開発サーバー |
| `pnpm build` / `pnpm start` | 本番ビルド / 起動 |
| `pnpm test` / `pnpm test:run` | Vitest（watch / 単発） |
| `pnpm lint` | ESLint |
| `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` | Drizzle マイグレーション |
| `pnpm seed` | サンプルデータ投入（ローカル専用） |

---

## テスト

URL→videoID 抽出やサムネ生成、高評価判定などの純粋関数を Vitest で検証する
（`tests/youtube.test.ts` / `tests/rating.test.ts`）。テスト仕様の扱いは [`CLAUDE.md`](CLAUDE.md) を参照。

```bash
pnpm test:run
```

---

## デプロイ

Vercel + Turso。GitHub の `main` へ push すると自動で再デプロイされる。
本番 DB の作成・マイグレーション・環境変数・Google OAuth リダイレクト URI の設定手順は
[`docs/deployment.md`](docs/deployment.md) にまとめてある。

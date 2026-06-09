# favorite-video-curation

お気に入りの YouTube 動画を登録／再生できる Web アプリ（プライベート試写室）。

## 技術スタック

- Next.js（App Router） / React / TypeScript
- Turso（libSQL / SQLite）+ Drizzle ORM
- Better Auth（Google OAuth）
- Vitest / pnpm / Vercel

仕様・設計は [`plans/implementation-plan.md`](plans/implementation-plan.md)、進捗は [`plans/tasks.md`](plans/tasks.md) を参照。

## セットアップ

```bash
pnpm install
cp .env.example .env        # 値を埋める（ローカルは TURSO_DATABASE_URL=file:./local.db でも可）
pnpm db:generate            # スキーマからマイグレーション生成
# 本番(Turso): pnpm db:migrate / ローカル(file:) はマイグレーションSQLを適用
pnpm seed                   # 動作確認用のサンプル動画を投入（任意）
pnpm dev                    # http://localhost:3000
```

### Google OAuth

Google Cloud Console で OAuth クライアントを作成し、リダイレクト URI に
`http://localhost:3000/api/auth/callback/google`（本番は本番ドメイン）を登録。
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を `.env` に設定する。
管理者は `ADMIN_EMAIL` に一致するメールアドレスのユーザー。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 開発サーバー |
| `pnpm build` / `pnpm start` | 本番ビルド / 起動 |
| `pnpm test` / `pnpm test:run` | Vitest（watch / 単発） |
| `pnpm lint` | ESLint |
| `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` | Drizzle マイグレーション |
| `pnpm seed` | サンプルデータ投入 |

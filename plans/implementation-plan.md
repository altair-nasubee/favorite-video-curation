# favorite-video-curation 実装プラン

YouTube のお気に入り動画を登録・再生する Web アプリの実装計画。
壁打ちで確定した仕様をもとに、技術構成・データモデル・画面・実装手順をまとめる。

---

## 1. 確定仕様サマリ

| 論点 | 決定 |
| --- | --- |
| 認証 | Google 認証。誰でもログイン可。管理者は環境変数 `ADMIN_EMAIL`（`altair@nasubee.com`）で判定 |
| 非公開動画 | 一般画面には表示しない。管理画面のみ表示 |
| 視聴済み記録 | 動画の **再生開始** で自動記録（YouTube IFrame Player API の再生イベント） |
| 評価 | ユーザーごとに保存。**整数 1〜5** の星評価 |
| 高評価カテゴリ | **全ユーザーの平均評価が 4.0 以上**（評価 1 件以上） |
| 未視聴カテゴリ | 公開動画のうち、ログインユーザーが未視聴のもの |
| 再生方式 | 詳細画面で **インライン再生**（サムネクリック → iframe に差し替え） |
| 一覧の並び順 | 登録日時の **降順（新しい順）** |
| デザイン | ダークテーマの動画向け。主要ボタン名（Add Video / Back / Submit / Remove）は英語 |
| デプロイ | Vercel + Turso（libSQL） |
| 開発環境 | pnpm + TypeScript / Next.js App Router |
| テスト | 純粋ロジック（URL→videoID 抽出、サムネ生成、平均評価判定）に Vitest ユニットテスト |
| シード | `pnpm seed` で投入。登録動画は後ほどユーザーが指定（暫定はプレースホルダー） |

---

## 2. 技術スタック

- **Framework**: Next.js（App Router） / React / TypeScript
- **Backend**: Next.js Server Actions（一部 Route Handler）
- **DB**: Turso（libSQL / SQLite）
- **ORM**: Drizzle ORM + `@libsql/client`
- **Auth**: Better Auth（Google OAuth、セッション）。Drizzle アダプタで Turso にユーザー/セッションを保存
- **Test**: Vitest
- **Package manager**: pnpm
- **Deploy**: Vercel（`pnpm-lock.yaml` 検出で自動 pnpm ビルド）

---

## 3. アーキテクチャ概要

```
[Browser]
   │  Server Actions / fetch
   ▼
[Next.js App Router]
   ├─ UI（Server Components 中心、再生・評価などは Client Components）
   ├─ Server Actions（DB 読み書き、認可チェック）
   ├─ Better Auth（/api/auth/[...all] ルート、セッション取得）
   ▼ Drizzle ORM
[Turso (libSQL / SQLite)]
```

- データ取得は基本 Server Component で行い、ミューテーション（評価・視聴状態・動画CRUD）は Server Actions。
- 認可は「Server Action / ページ単位でセッションを取得 → admin 判定」を共通ヘルパーで実施。クライアントのボタン制御だけに頼らず、**サーバー側でも `/admin` 系をガード**する。

---

## 4. データモデル（Drizzle スキーマ）

Better Auth が生成する `user` / `session` / `account` / `verification` テーブルに加え、アプリ固有テーブルを定義する。

### videos（動画マスタ）
| カラム | 型 | 説明 |
| --- | --- | --- |
| id | text (PK, uuid) | 動画レコードID |
| youtube_video_id | text | YouTube の videoID（URL から抽出） |
| category | text | カテゴリ名（自由文字列） |
| title | text | 表示タイトル |
| is_public | integer (bool) | 公開/非公開 |
| created_at | integer (timestamp) | 登録日時（自動付与） |

- サムネイルURLはカラムに持たず `youtube_video_id` から動的生成（`https://i.ytimg.com/vi/<id>/hqdefault.jpg`）。
- カテゴリは専用テーブルを作らず、`videos.category` の distinct を「既存カテゴリ候補」として扱う（シンプル優先）。

### user_video_states（ユーザーごとの視聴・評価状態）
| カラム | 型 | 説明 |
| --- | --- | --- |
| id | text (PK, uuid) | |
| user_id | text (FK → user.id) | |
| video_id | text (FK → videos.id) | |
| watched | integer (bool) | 視聴済みフラグ（再生開始でtrue） |
| watched_at | integer (timestamp, nullable) | 視聴日時 |
| rating | integer (nullable) | 1〜5、未評価は null |
| rated_at | integer (timestamp, nullable) | 評価日時 |

- `(user_id, video_id)` にユニーク制約。状態は upsert で更新。
- 「未視聴に戻す」= `watched=false`, `watched_at=null` に更新。

### 集計の考え方（仮想カテゴリ）
- **未視聴の動画**: `is_public=true` の動画のうち、当該ユーザーの state が無い or `watched=false`。
- **評価の高い動画**: `is_public=true` かつ「全ユーザーの rating 平均 ≥ 4.0（評価1件以上）」。SQL の `AVG(rating)` を `GROUP BY video_id` し `HAVING avg >= 4.0` で取得。

---

## 5. 認証・認可設計

- **Better Auth** を `/api/auth/[...all]` の Route Handler でマウント。Google Provider を設定。
- セッション取得ヘルパー `getSession()` と、`requireUser()` / `requireAdmin()` を用意。
- **admin 判定**: `session.user.email === process.env.ADMIN_EMAIL`。`isAdmin(session)` ヘルパーを共通化。
- **未ログイン時**: 保護ページ（一覧・詳細・管理）はサーバー側でセッション確認し、未ログインなら `/login` へリダイレクト。
- **管理画面ボタン**: 全ユーザーに常時表示。非管理者が押下 → クライアントで警告（トースト/ダイアログ）を出し遷移しない。加えて `/admin/**` ページ自体も `requireAdmin()` でサーバーガード（直接URL叩き対策）。

---

## 6. 画面構成とルーティング

| パス | 画面 | 主な内容 |
| --- | --- | --- |
| `/login` | ログイン | Google ログインボタン。成功で `/` へ |
| `/` | 動画一覧 | カテゴリごとのサムネ。先頭に「未視聴の動画」「評価の高い動画」。クリックで詳細へ |
| `/videos/[id]` | 動画詳細 | カテゴリ/タイトル/サムネ/登録日時/自分の評価。サムネクリックでインライン再生（再生開始で視聴済み）。星評価変更、[未視聴に戻す]、[Back] |
| `/admin` | 管理画面 | [Add Video] 常時表示。カテゴリごとの動画リスト（非公開含む）。行クリックで詳細管理へ |
| `/admin/videos/new` | 動画追加 | カテゴリ（既存候補＋自由入力）/タイトル/YouTube URL/公開切替。[Submit] [Back] |
| `/admin/videos/[id]` | 詳細管理 | 各項目表示。カテゴリ/タイトル/公開非公開を編集。[Remove] [Back] |

### 共通レイアウト
- 画面上部ヘッダー（サイドバーなし）。
- ヘッダーに「管理画面へ」ボタンを常時配置（非管理者は警告）。
- ユーザー表示・ログアウトもヘッダーに配置。

---

## 7. Server Actions / ロジック一覧

- `signOutAction`（Better Auth）
- `getVideoListForUser(userId)` — 公開動画をカテゴリ別＋仮想カテゴリ（未視聴・高評価）で整形して返す
- `getVideoDetail(videoId, userId)` — 動画＋自分の state
- `setRating(videoId, rating)` — upsert（1〜5）
- `markWatched(videoId)` — 再生開始時に呼ぶ。upsert で `watched=true`
- `resetWatched(videoId)` — `watched=false`
- `getCategories()` — distinct カテゴリ一覧（動画追加の候補用、管理者）
- `getAdminVideoList()` — 非公開含む全動画をカテゴリ別に（admin限定）
- `createVideo({ category, title, youtubeUrl, isPublic })` — URL から videoID 抽出して保存（admin限定）
- `updateVideo(id, { category, title, isPublic })`（admin限定）
- `deleteVideo(id)`（admin限定）

各 admin アクションは冒頭で `requireAdmin()`。

---

## 8. YouTube ユーティリティ（テスト対象）

`lib/youtube.ts`:
- `extractVideoId(url: string): string | null`
  - 対応: `https://www.youtube.com/watch?v=ID`、`https://youtu.be/ID`、`https://www.youtube.com/embed/ID`、`https://www.youtube.com/shorts/ID`、追加パラメータ（`&t=`, `&list=`）付き。
- `thumbnailUrl(videoId, quality = 'hqdefault')` — `https://i.ytimg.com/vi/<id>/<quality>.jpg`
- `embedUrl(videoId)` — `https://www.youtube.com/embed/<id>?enablejsapi=1`

これらに Vitest のユニットテストを付ける（正常系＋異常系）。

---

## 9. 再生・視聴済み連携（クライアント）

- 詳細画面の再生は Client Component。
- サムネクリックで YouTube IFrame Player を生成（`enablejsapi=1`）。
- `onStateChange` で `PLAYING` を検知したタイミングで `markWatched(videoId)` を一度だけ呼ぶ。
- 成功後、一覧の「未視聴」カテゴリは次回取得時に更新（必要なら `revalidatePath('/')`）。

---

## 10. UI / デザイン方針

- **ダークテーマ**ベース。動画サムネのグリッドが映える落ち着いた背景。
- 一覧はカテゴリ見出し＋横スクロール or グリッドのサムネカード。
- サムネカードに視聴済み/評価のバッジ表示。
- 星評価はホバー＆クリックで操作できる 5 連星 UI（整数）。
- frontend-design / web-design-guidelines / vercel-react-best-practices の各 Skill を実装フェーズで適用（アクセシビリティ・パフォーマンス・コンポーネント設計）。
- レスポンシブ対応（PC 中心、モバイルでも崩れない最低限）。

---

## 11. シードデータ

- `scripts/seed.ts`（`tsx` 実行、`pnpm seed`）。
- 内容: サンプル動画を複数カテゴリに登録、一部を非公開に設定。動作確認用に擬似評価データも投入し「高評価カテゴリ」を確認可能にする。
- **登録する具体的な動画 URL / カテゴリはユーザーが後で指定**。それまではプレースホルダーの公開動画IDで雛形を用意。
- 注意: 擬似評価は架空ユーザー扱いになるため、実ログインユーザーの体験とは別物である点を明記。

---

## 12. テスト方針（最低限テストの仕様）

### 12.1 方針

- **ツール**: Vitest。実行は `pnpm test`（CI 用に `pnpm test:run` で watch なし）。
- **対象**: バグると全機能が崩れる純粋関数（DB・ネットワーク・認証に依存しないもの）に限定。
  - `lib/youtube.ts`: `extractVideoId` / `thumbnailUrl` / `embedUrl`
  - `lib/rating.ts`: `averageRating` / `isHighRated`（高評価カテゴリの判定）
- **スコープ外**: E2E、Server Action / DB 結合、Better Auth（OAuth 絡みで構築コストが高く費用対効果が低い）。
- 各関数につき「正常系・代表的バリエーション・異常系（境界値）」を最低限カバーする。

### 12.2 テスト対象関数のシグネチャ（前提）

```ts
// lib/youtube.ts
export function extractVideoId(url: string): string | null;
export function thumbnailUrl(videoId: string, quality?: ThumbnailQuality): string; // 既定 'hqdefault'
export function embedUrl(videoId: string): string;

// lib/rating.ts
export function averageRating(ratings: number[]): number | null; // 評価0件は null
export function isHighRated(ratings: number[], threshold?: number): boolean; // 既定 4.0、1件以上 & 平均>=threshold
```

> 実装側でシグネチャを変える場合は本節も合わせて更新する。`isHighRated` は「評価1件以上 かつ 平均 ≥ 4.0」を満たすときのみ `true`。

### 12.3 ファイル構成

```
tests/
  youtube.test.ts
  rating.test.ts
```

### 12.4 `extractVideoId` テストケース（`tests/youtube.test.ts`）

videoID は `dQw4w9WgXcQ` を代表値として使用。

| # | 入力 URL | 期待 |
| --- | --- | --- |
| 1 | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` | `dQw4w9WgXcQ` |
| 2 | `https://youtube.com/watch?v=dQw4w9WgXcQ`（www なし） | `dQw4w9WgXcQ` |
| 3 | `https://youtu.be/dQw4w9WgXcQ` | `dQw4w9WgXcQ` |
| 4 | `https://www.youtube.com/embed/dQw4w9WgXcQ` | `dQw4w9WgXcQ` |
| 5 | `https://www.youtube.com/shorts/dQw4w9WgXcQ` | `dQw4w9WgXcQ` |
| 6 | `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s` | `dQw4w9WgXcQ` |
| 7 | `https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxxxx&index=2` | `dQw4w9WgXcQ` |
| 8 | `https://youtu.be/dQw4w9WgXcQ?t=42` | `dQw4w9WgXcQ` |
| 9 | `http://www.youtube.com/watch?v=dQw4w9WgXcQ`（http） | `dQw4w9WgXcQ` |
| 10 | `https://example.com/watch?v=dQw4w9WgXcQ`（YouTube 以外） | `null` |
| 11 | `not a url` | `null` |
| 12 | `''`（空文字） | `null` |
| 13 | `https://www.youtube.com/watch?v=`（v 空） | `null` |

### 12.5 `thumbnailUrl` / `embedUrl` テストケース

| 関数 | 入力 | 期待 |
| --- | --- | --- |
| `thumbnailUrl` | `('dQw4w9WgXcQ')`（既定品質） | `https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg` |
| `thumbnailUrl` | `('dQw4w9WgXcQ', 'maxresdefault')` | `https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg` |
| `embedUrl` | `('dQw4w9WgXcQ')` | `enablejsapi=1` を含み、`https://www.youtube.com/embed/dQw4w9WgXcQ` で始まる |

### 12.6 `averageRating` / `isHighRated` テストケース（`tests/rating.test.ts`）

| 関数 | 入力 | 期待 | 意図 |
| --- | --- | --- | --- |
| `averageRating` | `[]` | `null` | 評価なし |
| `averageRating` | `[4]` | `4` | 1件 |
| `averageRating` | `[4, 5, 3]` | `4` | 平均 |
| `averageRating` | `[5, 4]` | `4.5` | 小数 |
| `isHighRated` | `[]` | `false` | 0件は対象外 |
| `isHighRated` | `[4]` | `true` | 境界値ちょうど 4.0 |
| `isHighRated` | `[3, 5]` | `true` | 平均 4.0 |
| `isHighRated` | `[3, 4]` | `false` | 平均 3.5 |
| `isHighRated` | `[5, 5]` | `true` | 高評価 |
| `isHighRated` | `([3], 3.0)`（しきい値指定） | `true` | しきい値引数の確認 |

### 12.7 受け入れ基準

- `pnpm test` が全ケース green。
- 上記テーブルの全行をテストコードで網羅していること。
- 新たな URL 形式やしきい値仕様の変更があった場合は、ケースを追加してから実装を直す（テスト先行で回帰を防ぐ）。

---

## 13. 環境変数（`.env.local` / Vercel）

| 変数 | 用途 |
| --- | --- |
| `TURSO_DATABASE_URL` | Turso 接続URL |
| `TURSO_AUTH_TOKEN` | Turso 認証トークン |
| `BETTER_AUTH_SECRET` | Better Auth セッション署名 |
| `BETTER_AUTH_URL` | アプリのベースURL（本番ドメイン / localhost） |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `ADMIN_EMAIL` | 管理者判定（`altair@nasubee.com`） |

- `.env.example` を用意。Google OAuth のリダイレクトURIは localhost と本番ドメインの両方を登録。

---

## 14. ディレクトリ構成（想定）

```
src/
  app/
    layout.tsx                  # 共通レイアウト＋ヘッダー
    login/page.tsx
    page.tsx                    # 動画一覧
    videos/[id]/page.tsx        # 動画詳細
    admin/
      page.tsx                  # 管理画面
      videos/new/page.tsx       # 動画追加
      videos/[id]/page.tsx      # 詳細管理
    api/auth/[...all]/route.ts  # Better Auth
  components/                   # UI（VideoCard, StarRating, Player, Header...）
  lib/
    auth.ts                     # Better Auth 設定
    auth-helpers.ts             # getSession/requireUser/requireAdmin/isAdmin
    db/
      index.ts                  # Drizzle クライアント
      schema.ts                 # スキーマ
    youtube.ts                  # URL/サムネ ユーティリティ
  actions/                      # Server Actions
scripts/seed.ts
drizzle/                        # マイグレーション
tests/                          # Vitest
```

---

## 15. 実装手順（フェーズ）

1. **基盤セットアップ**: Next.js(App Router)+TS+pnpm 初期化、ディレクトリ、Lint/Format、Vitest 設定。
2. **DB / ORM**: Drizzle + libSQL クライアント、スキーマ定義、マイグレーション、Turso 接続確認。
3. **認証**: Better Auth + Google、`/api/auth`、auth ヘルパー、`/login` 画面、未ログインリダイレクト。
4. **YouTube ユーティリティ + テスト**: `lib/youtube.ts` と Vitest。
5. **管理機能**: 管理画面・動画追加・詳細管理、CRUD Server Actions、admin ガード。
6. **一覧 / 詳細（一般）**: カテゴリ別一覧、仮想カテゴリ、詳細画面、星評価、視聴済み（再生開始連携）、未視聴に戻す。
7. **共通UI / デザイン**: ヘッダー、ダークテーマ、サムネカード、星 UI、レスポンシブ。Skill 適用。
8. **シード**: `scripts/seed.ts`（ユーザー指定動画を反映）。
9. **仕上げ**: 動作確認、アクセシビリティ/パフォーマンスレビュー、`.env.example`、デプロイ手順整備。

---

## 16. 前提・未決事項（実装中に確認したい点）

- シードに登録する具体的な YouTube 動画 URL / カテゴリ分け（ユーザー指定待ち）。
- 「評価の高い動画」の擬似評価をシードに入れるか（実ユーザー体験と別物になる点の合意）。
- カテゴリの表示順（現状はカテゴリ名 or 任意。必要なら並び順指定を追加可能）。
- 本番ドメイン（Vercel）確定後に Google OAuth リダイレクトURI / `BETTER_AUTH_URL` を設定。

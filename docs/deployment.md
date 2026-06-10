# デプロイ手順（Vercel + Turso + Google OAuth）

本番環境へデプロイするための手順。ローカル開発の `.env` とは別に、
**本番用のクレデンシャルを取得し直して** Vercel の環境変数に設定する。

> 秘密情報（トークン・シークレット）はリポジトリにコミットしない。
> すべて Vercel の環境変数側に登録する。

---

## 0. 全体像


| 項目                                          | 本番での値の出どころ                               |
| ------------------------------------------- | ---------------------------------------- |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`   | Turso（本番DB）                              |
| `BETTER_AUTH_SECRET`                        | 新規生成（ランダム文字列）                            |
| `BETTER_AUTH_URL`                           | 本番ドメイン（例: `https://your-app.vercel.app`） |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console（本番用 OAuth クライアント）   |


手順は **1) Turso → 2) Google OAuth → 3) Vercel → 4) マイグレーション → 5) 動作確認** の順で進めるとスムーズ。

---

## 1. Turso（本番データベース）

Tursoを使用するための準備として、
https://turso.tech/ を開いて [Start for free now] 押下 > GitHubのアカウントでサインインしておくこと。

### 1.1 CLI 準備

```bash
# Turso CLI のインストール（未導入の場合）
curl -sSfL https://get.tur.so/install.sh | bash

# ターミナル再起動してインストール成功したことを確認
source ~/.bashrc
turso --version

# ログイン（Macの場合）
turso auth login

# ログイン（WSLの場合）
# 注意："turso auth login"は、WSLではブラウザが開けずエラーになる
# 代わりに以下の手順でコマンドを実行する
turso auth login --headless
# (1) URLが表示される
# (2) ブラウザでそのアドレスを開き、GitHubでサインインする
# (3) turso config set token "<YOUR TOKEN>" が表示されるのでコピー
# (4) ターミナルでコピーしたコマンドをそのまま実行
# (5) "Token set succesfully." と表示されれば成功
```

### 1.2 DB 作成と接続情報の取得

```bash
# DB を作成（名前・リージョンは任意）
turso db create favorite-video-curation

# データベース URL を表示（→ TURSO_DATABASE_URL）
turso db show favorite-video-curation --url
# 例: libsql://favorite-video-curation-xxxx.turso.io

# 認証トークンを発行（→ TURSO_AUTH_TOKEN）
turso db tokens create favorite-video-curation
```

取得した **URL** と **トークン** を控える（後で Vercel に登録）。

---

## 2. Google OAuth（本番用クライアント）

[Google Cloud Console](https://console.cloud.google.com/) で設定する。

1. **プロジェクト**を選択（または新規作成）。
2. 「APIとサービス」→「OAuth 同意画面」を設定（External / アプリ名 / サポートメール等）。
  - テスト段階ではテストユーザーに対象アカウントを追加。一般公開する場合は公開ステータスにする。
3. 「認証情報」→「認証情報を作成」→「OAuth クライアント ID」→ アプリの種類「ウェブアプリケーション」。
4. 以下を登録する（**本番ドメインに合わせる**）。
  **承認済みの JavaScript 生成元（Authorized JavaScript origins）**
   **承認済みのリダイレクト URI（Authorized redirect URIs）**
  > パスは Better Auth の規約で `/api/auth/callback/google` 固定。
  > 末尾スラッシュや `http`/`https`、サブドメインの差異も別物として扱われるため厳密に一致させる。
  > ローカル開発も併用するなら `http://localhost:3000/api/auth/callback/google` も追加しておく。
5. 発行された **クライアント ID** と **クライアントシークレット**を控える。

---

## 3. Vercel（プロジェクトと環境変数）

### 3.1 プロジェクト作成

Vercel は「GitHub のリポジトリ」を取り込んで自動でビルド・公開する。以下を順に行う。

**事前準備: コードを GitHub に push しておく**

Vercel は GitHub 上のコードを読むため、ローカルのコミットをリモートに反映しておく必要がある。

```bash
# まだ GitHub にリモートが無い場合は、GitHub で空のリポジトリを作成してから:
git remote add origin https://github.com/<ユーザー名>/favorite-video-curation.git
git push -u origin main
```

> `.env` と `local.db` は `.gitignore` 済みなので push されない（秘密情報は含まれない）。

**手順**

1. [vercel.com](https://vercel.com/) にアクセスし、**「Sign Up」/「Log In」→ Continue with GitHub** で GitHub アカウントでログインする。
2. ダッシュボード右上の **「Add New…」→「Project」** をクリック。
3. **「Import Git Repository」** の一覧から `favorite-video-curation` を探し、**「Import」** を押す。
   - 一覧に出ない場合は **「Adjust GitHub App Permissions」**（または「Configure GitHub App」）から、Vercel にこのリポジトリへのアクセスを許可する。
4. **「Configure Project」** 画面が開く。次を確認・設定する。
   - **Project Name**: そのままで可。ここで決めた名前が本番ドメインになる
     （例: `favorite-video-curation` → `https://favorite-video-curation.vercel.app`）。
     **この URL を手順2の Google リダイレクト URI と、3.2 の `BETTER_AUTH_URL` に使う**ので控えておく。
   - **Framework Preset**: `Next.js` が自動検出される（変更不要）。
   - **Root Directory**: `./`（変更不要）。
   - **Build and Output Settings**: 既定のままで可
     （`pnpm-lock.yaml` を検出して **pnpm** が自動採用され、Build = `next build` になる。手動設定は不要）。
5. **「Environment Variables」** セクションを開き、**3.2 の表の7項目をここで先に登録する**
   （初回デプロイ前に入れておくと、ログイン等が最初から正しく動く）。
6. **「Deploy」** ボタンを押す。ビルドが走り、数分で完了する。
7. 完了画面に本番 URL（`https://<プロジェクト名>.vercel.app`）が表示される。これがアプリの公開アドレス。

> 以降は **main ブランチへ push するたびに自動で再デプロイ**される。

### 3.2 環境変数を登録

環境変数は **3.1 のインポート時（手順5）** に入れても、**後から** 設定しても同じ。
後から入れる場合は、プロジェクトの **「Settings」→「Environment Variables」** を開き、以下を
**Production（必要なら Preview/Development も）** に登録する。
（既にデプロイ済みの場合は、変数を追加・変更したあと **再デプロイ**すると反映される。）


| Key                    | Value                                  |
| ---------------------- | -------------------------------------- |
| `TURSO_DATABASE_URL`   | 手順1の URL（`libsql://...`）               |
| `TURSO_AUTH_TOKEN`     | 手順1のトークン                               |
| `BETTER_AUTH_SECRET`   | `openssl rand -base64 32` で生成した値       |
| `BETTER_AUTH_URL`      | 本番URL（例 `https://your-app.vercel.app`） |
| `GOOGLE_CLIENT_ID`     | 手順2のクライアント ID                          |
| `GOOGLE_CLIENT_SECRET` | 手順2のクライアントシークレット                       |


> `BETTER_AUTH_URL` は実際に配信されるドメインと完全一致させる。
> 独自ドメインを後から割り当てた場合は、この値と Google のリダイレクト URI も更新する。

ローカルの値は `.env.example` を参照（中身はプレースホルダー）。

---

## 4. データベースマイグレーション（本番）

本番 DB へスキーマを適用する。ローカルに本番の接続情報を一時的に設定して実行するのが簡単。

```bash
# 本番の接続情報を環境変数に通してマイグレーション適用
TURSO_DATABASE_URL="libsql://favorite-video-curation-xxxx.turso.io" \
TURSO_AUTH_TOKEN="<本番トークン>" \
pnpm db:migrate
```

- `drizzle/` 配下のマイグレーション（リポジトリにコミット済み）が適用される。
- スキーマを変更した場合は `pnpm db:generate` で新しいマイグレーションを作ってからコミット → 再度 `db:migrate`。
- 動作確認用にサンプルを入れたい場合のみ `pnpm seed`（本番に入れる必要は通常なし）。

---

## 5. デプロイと動作確認

1. Vercel で Deploy（main への push で自動デプロイ）。
2. 本番URLにアクセスし、以下を確認:
  - 未ログインで `/` → `/login` にリダイレクトされる。
  - Google ログインが成功し `/` に遷移する。
  - サムネ表示・再生・視聴済み記録・星評価・未視聴に戻すが動作する。
  - ログインユーザーなら誰でも「管理画面」に入れる（管理者の区別なし）。
  - 非公開動画が一般一覧に出ない（管理画面には表示される）。

---

## 6. トラブルシューティング


| 症状                             | 確認ポイント                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| ログイン後に `redirect_uri_mismatch` | Google のリダイレクト URI が `https://<本番ドメイン>/api/auth/callback/google` と厳密一致しているか                              |
| ログインできるが直後にセッション切れ             | `BETTER_AUTH_URL` が実ドメインと一致しているか。`BETTER_AUTH_SECRET` が設定済みか                                             |
| DB エラー（テーブルが無い等）               | 手順4のマイグレーションを本番 DB に適用したか                                                                                |
| ビルドは通るが画像が出ない                  | `next.config.ts` の `images.remotePatterns`（`i.ytimg.com` / `img.youtube.com`）。サムネは `<img>` 直参照のため通常は影響なし |


---

## 7. 独自ドメインを使う場合

1. Vercel でドメインを割り当て。
2. `BETTER_AUTH_URL` をそのドメインに更新。
3. Google OAuth の「承認済みオリジン」と「リダイレクト URI」を新ドメインに更新（旧ドメインのものは必要に応じて残す/削除）。
4. 再デプロイ。

---

## 8. 補足：MCPサーバーについて

Turso MCP サーバーは、Claude などの AI アシスタントが自然言語で Turso を操作（DB作成・トークン発行・クエリ・スキーマ設計）できるようにする**開発／運用の補助ツール**で、**サーバー自体は無料**（Turso の利用料金プランには影響しない）。アプリのランタイム構成要素ではなく、本番接続は本書の手順1〜4のとおり。

今回の開発では使用しない。必要になった場合は Claude などの AI アシスタントに質問して導入すること。

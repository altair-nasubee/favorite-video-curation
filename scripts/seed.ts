/**
 * 開発用シードスクリプト: `pnpm seed`
 *
 * SAMPLES に定義した動画を投入する。実行すると videos テーブルを
 * 全削除してから入れ直す（接続先は .env の TURSO_DATABASE_URL に従う。
 * 本番に向けて実行すると本番データが消えるため、ローカル file:./local.db で使うこと）。
 *
 * 高評価カテゴリ（全ユーザー平均 4.0 以上）の確認には評価データが必要だが、
 * 評価は実在ユーザー（Google ログイン）に紐づくため、ここでは投入しない。
 * 動作確認時はログイン後に画面から評価を付けて確認する。
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { videos } from "../src/lib/db/schema";

type Seed = {
  youtubeVideoId: string;
  category: string;
  title: string;
  isPublic: boolean;
};

const SAMPLES: Seed[] = [
  {
    youtubeVideoId: "a1MDCj0T0c4",
    category: "Juice=Juice",
    title: "CHOICE & CHANCE ハロ！ステ Live Edit.",
    isPublic: true,
  },
  {
    youtubeVideoId: "xW3p6ZmX5CA",
    category: "Juice=Juice",
    title: "BLOODY BULLET",
    isPublic: true,
  },
  {
    youtubeVideoId: "WvdT3_XHYIk",
    category: "Juice=Juice",
    title: "甘えんな",
    isPublic: true,
  },
  {
    youtubeVideoId: "se9LaV0wbkQ",
    category: "ストレッチ",
    title: "何やっても落ちない体重が-10kg🔥カエル足ダイエットストレッチ",
    isPublic: true,
  },
];

async function main() {
  console.log("Seeding videos...");
  await db.delete(videos);
  await db.insert(videos).values(SAMPLES);
  console.log(`Inserted ${SAMPLES.length} videos.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

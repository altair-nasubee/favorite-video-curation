/**
 * 開発用シードスクリプト: `pnpm seed`
 *
 * 注意: 下記の動画はあくまで動作確認用のプレースホルダー。
 * 実際に登録したい動画 URL / カテゴリが決まったら差し替えること
 * （implementation-plan.md §11 / §16 の未決事項）。
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
    youtubeVideoId: "aqz-KE-bpKQ",
    category: "Showcase",
    title: "Big Buck Bunny（サンプル）",
    isPublic: true,
  },
  {
    youtubeVideoId: "dQw4w9WgXcQ",
    category: "Music",
    title: "クラシックな名曲（サンプル）",
    isPublic: true,
  },
  {
    youtubeVideoId: "ScMzIvxBSi4",
    category: "Nature",
    title: "風景タイムラプス（サンプル）",
    isPublic: true,
  },
  {
    youtubeVideoId: "M7lc1UVf-VE",
    category: "Learning",
    title: "開発チュートリアル（サンプル）",
    isPublic: true,
  },
  {
    youtubeVideoId: "kJQP7kiw5Fk",
    category: "Music",
    title: "非公開テスト動画（サンプル）",
    isPublic: false,
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

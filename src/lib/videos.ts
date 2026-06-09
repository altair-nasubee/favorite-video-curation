import "server-only";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { userVideoStates, videos, type Video } from "@/lib/db/schema";
import { HIGH_RATING_THRESHOLD } from "@/lib/rating";

export type VideoCard = {
  id: string;
  youtubeVideoId: string;
  title: string;
  category: string;
  createdAt: Date;
  watched: boolean;
  rating: number | null;
};

export type CategorySection = {
  key: string;
  title: string;
  videos: VideoCard[];
};

export const UNWATCHED_KEY = "__unwatched";
export const HIGH_RATED_KEY = "__high_rated";

/** 全ユーザーの平均評価が HIGH_RATING_THRESHOLD 以上の動画 ID 集合。 */
async function getHighRatedVideoIds(): Promise<Set<string>> {
  const rows = await db
    .select({ videoId: userVideoStates.videoId })
    .from(userVideoStates)
    .where(isNotNull(userVideoStates.rating))
    .groupBy(userVideoStates.videoId)
    .having(sql`avg(${userVideoStates.rating}) >= ${HIGH_RATING_THRESHOLD}`);
  return new Set(rows.map((r) => r.videoId));
}

/**
 * 一般ユーザー向け一覧。公開動画を「未視聴」「評価の高い動画」＋カテゴリ別に整形。
 * 並びは登録日時の降順（新しい順）。
 */
export async function getVideoListForUser(
  userId: string,
): Promise<CategorySection[]> {
  const rows = await db
    .select({
      id: videos.id,
      youtubeVideoId: videos.youtubeVideoId,
      title: videos.title,
      category: videos.category,
      createdAt: videos.createdAt,
      watched: userVideoStates.watched,
      rating: userVideoStates.rating,
    })
    .from(videos)
    .leftJoin(
      userVideoStates,
      and(
        eq(userVideoStates.videoId, videos.id),
        eq(userVideoStates.userId, userId),
      ),
    )
    .where(eq(videos.isPublic, true))
    .orderBy(desc(videos.createdAt));

  const cards: VideoCard[] = rows.map((r) => ({
    id: r.id,
    youtubeVideoId: r.youtubeVideoId,
    title: r.title,
    category: r.category,
    createdAt: r.createdAt,
    watched: r.watched ?? false,
    rating: r.rating ?? null,
  }));

  const highRatedIds = await getHighRatedVideoIds();
  const sections: CategorySection[] = [];

  // 仮想カテゴリ: 未視聴の動画
  const unwatched = cards.filter((c) => !c.watched);
  if (unwatched.length > 0) {
    sections.push({
      key: UNWATCHED_KEY,
      title: "未視聴の動画",
      videos: unwatched,
    });
  }

  // 仮想カテゴリ: 評価の高い動画（全員平均 4.0 以上）
  const highRated = cards.filter((c) => highRatedIds.has(c.id));
  if (highRated.length > 0) {
    sections.push({
      key: HIGH_RATED_KEY,
      title: "評価の高い動画",
      videos: highRated,
    });
  }

  // 通常カテゴリ（登録日時降順の出現順を維持）
  const byCategory = new Map<string, VideoCard[]>();
  for (const c of cards) {
    const list = byCategory.get(c.category);
    if (list) list.push(c);
    else byCategory.set(c.category, [c]);
  }
  for (const [category, list] of byCategory) {
    sections.push({ key: `cat:${category}`, title: category, videos: list });
  }

  return sections;
}

export type VideoDetail = {
  video: Video;
  watched: boolean;
  rating: number | null;
};

/** 動画1件と、ログインユーザーの視聴・評価状態を取得。存在しなければ null。 */
export async function getVideoDetail(
  videoId: string,
  userId: string,
): Promise<VideoDetail | null> {
  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);
  if (!video) return null;

  const [state] = await db
    .select()
    .from(userVideoStates)
    .where(
      and(
        eq(userVideoStates.videoId, videoId),
        eq(userVideoStates.userId, userId),
      ),
    )
    .limit(1);

  return {
    video,
    watched: state?.watched ?? false,
    rating: state?.rating ?? null,
  };
}

/** 既存カテゴリ一覧（動画追加の候補用）。 */
export async function getCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: videos.category })
    .from(videos)
    .orderBy(videos.category);
  return rows.map((r) => r.category);
}

export type AdminCategorySection = {
  category: string;
  videos: Video[];
};

/** 管理画面向け。非公開を含む全動画をカテゴリ別に。 */
export async function getAdminVideoList(): Promise<AdminCategorySection[]> {
  const rows = await db.select().from(videos).orderBy(desc(videos.createdAt));
  const byCategory = new Map<string, Video[]>();
  for (const v of rows) {
    const list = byCategory.get(v.category);
    if (list) list.push(v);
    else byCategory.set(v.category, [v]);
  }
  return Array.from(byCategory, ([category, vids]) => ({
    category,
    videos: vids,
  }));
}

/** 管理画面向け。動画1件を取得（非公開含む）。 */
export async function getVideoById(videoId: string): Promise<Video | null> {
  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);
  return video ?? null;
}

"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userVideoStates } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth-helpers";

type StatePatch = Partial<{
  watched: boolean;
  watchedAt: Date | null;
  rating: number | null;
  ratedAt: Date | null;
}>;

/** (userId, videoId) の状態行を upsert する。 */
async function upsertState(userId: string, videoId: string, patch: StatePatch) {
  const [existing] = await db
    .select({ id: userVideoStates.id })
    .from(userVideoStates)
    .where(
      and(
        eq(userVideoStates.userId, userId),
        eq(userVideoStates.videoId, videoId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(userVideoStates)
      .set(patch)
      .where(eq(userVideoStates.id, existing.id));
  } else {
    await db.insert(userVideoStates).values({ userId, videoId, ...patch });
  }
}

/** 星評価（整数1〜5）を設定。 */
export async function setRating(videoId: string, rating: number) {
  const session = await requireUser();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("rating は 1〜5 の整数で指定してください");
  }
  await upsertState(session.user.id, videoId, {
    rating,
    ratedAt: new Date(),
  });
  revalidatePath("/");
  revalidatePath(`/videos/${videoId}`);
}

/** 視聴済みにする（再生開始時に呼ぶ）。 */
export async function markWatched(videoId: string) {
  const session = await requireUser();
  await upsertState(session.user.id, videoId, {
    watched: true,
    watchedAt: new Date(),
  });
  revalidatePath("/");
  revalidatePath(`/videos/${videoId}`);
}

/** 未視聴に戻す。 */
export async function resetWatched(videoId: string) {
  const session = await requireUser();
  await upsertState(session.user.id, videoId, {
    watched: false,
    watchedAt: null,
  });
  revalidatePath("/");
  revalidatePath(`/videos/${videoId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { extractVideoId } from "@/lib/youtube";

export type ActionState = { error?: string };

/** 動画を新規登録（admin）。失敗時は { error } を返し、成功時は /admin へリダイレクト。 */
export async function createVideo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const category = String(formData.get("category") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  const isPublic = formData.get("isPublic") === "on";

  if (!category) return { error: "カテゴリを入力してください" };
  if (!title) return { error: "表示タイトルを入力してください" };
  const youtubeVideoId = extractVideoId(youtubeUrl);
  if (!youtubeVideoId) {
    return { error: "有効な YouTube の動画 URL を入力してください" };
  }

  await db.insert(videos).values({ youtubeVideoId, category, title, isPublic });

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

/** 動画情報を更新（admin）。カテゴリ・タイトル・公開非公開のみ変更可。 */
export async function updateVideo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const isPublic = formData.get("isPublic") === "on";

  if (!id) return { error: "対象の動画が不明です" };
  if (!category) return { error: "カテゴリを入力してください" };
  if (!title) return { error: "表示タイトルを入力してください" };

  await db
    .update(videos)
    .set({ category, title, isPublic })
    .where(eq(videos.id, id));

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/admin/videos/${id}`);
  redirect("/admin");
}

/** 動画を削除（admin）。 */
export async function deleteVideo(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.delete(videos).where(eq(videos.id, id));
  }
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

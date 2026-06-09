import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getCategories, getVideoById } from "@/lib/videos";
import { updateVideo } from "@/actions/video-actions";
import { thumbnailUrl } from "@/lib/youtube";
import { Header } from "@/components/Header";
import { VideoForm } from "@/components/VideoForm";
import { RemoveVideoButton } from "@/components/RemoveVideoButton";

export default async function AdminVideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [video, categories] = await Promise.all([
    getVideoById(id),
    getCategories(),
  ]);

  if (!video) notFound();

  const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeVideoId}`;

  return (
    <>
      <Header />
      <main className="shell page">
        <div className="page-head">
          <p className="page-head__eyebrow">administration</p>
          <h1 className="page-head__title" style={{ fontSize: "2.2rem" }}>
            詳細管理
          </h1>
        </div>

        <div className="detail">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl(video.youtubeVideoId, "hqdefault")}
              alt=""
              width={480}
              height={360}
              style={{
                width: "100%",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                aspectRatio: "16 / 9",
                objectFit: "cover",
              }}
            />
            <div className="meta-row" style={{ marginTop: "1rem" }}>
              <span className="meta-row__label">登録日時</span>
              <span>{video.createdAt.toLocaleString("ja-JP")}</span>
            </div>
            <div className="meta-row">
              <span className="meta-row__label">現在の公開状態</span>
              <span>{video.isPublic ? "公開" : "非公開"}</span>
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <RemoveVideoButton id={video.id} />
            </div>
          </div>

          <div>
            <VideoForm
              action={updateVideo}
              categories={categories}
              mode="edit"
              initial={{
                id: video.id,
                category: video.category,
                title: video.title,
                youtubeUrl,
                isPublic: video.isPublic,
              }}
            />
          </div>
        </div>
      </main>
    </>
  );
}

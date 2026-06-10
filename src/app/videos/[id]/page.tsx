import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getVideoDetail } from "@/lib/videos";
import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { StarRating } from "@/components/StarRating";
import { ResetWatchedButton } from "@/components/ResetWatchedButton";
import { ArrowLeftIcon, CheckIcon } from "@/components/icons";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  const detail = await getVideoDetail(id, session.user.id);

  if (!detail) notFound();

  const { video, watched, rating } = detail;

  return (
    <>
      <Header />
      <main className="shell page">
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/" className="btn btn--ghost btn--sm">
            <ArrowLeftIcon /> Back
          </Link>
        </div>

        <div className="detail">
          <VideoPlayer videoId={video.id} youtubeVideoId={video.youtubeVideoId} />

          <aside className="detail__aside">
            <div>
              <p className="detail__eyebrow">{video.category}</p>
              <h1 className="detail__title">{video.title}</h1>
            </div>

            {watched && (
              <span className="badge badge--watched" style={{ alignSelf: "flex-start" }}>
                <CheckIcon /> 視聴済み
              </span>
            )}

            <div>
              <div className="meta-row">
                <span className="meta-row__label">登録日時</span>
                <span>
                  {video.createdAt.toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div>
              <p className="divider-label">あなたの評価</p>
              <StarRating videoId={video.id} value={rating} />
            </div>

            <ResetWatchedButton videoId={video.id} watched={watched} />
          </aside>
        </div>
      </main>
    </>
  );
}

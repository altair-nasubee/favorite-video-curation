import Link from "next/link";
import { thumbnailUrl } from "@/lib/youtube";
import type { VideoCard as VideoCardData } from "@/lib/videos";
import { CheckIcon, PlayIcon, StarIcon } from "./icons";

export function VideoCard({
  video,
  index = 0,
}: {
  video: VideoCardData;
  index?: number;
}) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className="card reveal"
      style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
    >
      <div className="card__thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl(video.youtubeVideoId, "hqdefault")}
          alt=""
          width={480}
          height={360}
          loading="lazy"
        />
        <div className="badges">
          {video.watched && (
            <span className="badge badge--watched">
              <CheckIcon /> 視聴済み
            </span>
          )}
          {video.rating != null && (
            <span className="badge badge--rating">
              <StarIcon size={12} /> {video.rating}
            </span>
          )}
        </div>
        <div className="card__play">
          <span className="play-glyph">
            <PlayIcon size={20} />
          </span>
        </div>
      </div>
      <div className="card__body">
        <span className="card__category">{video.category}</span>
        <h3 className="card__title">{video.title}</h3>
        <span className="card__date">
          {video.createdAt.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
    </Link>
  );
}

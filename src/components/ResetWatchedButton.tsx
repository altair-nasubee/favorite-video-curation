"use client";

import { useTransition } from "react";
import { resetWatched } from "@/actions/state-actions";

export function ResetWatchedButton({
  videoId,
  watched,
}: {
  videoId: string;
  watched: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="btn btn--ghost btn--block"
      disabled={pending || !watched}
      onClick={() => startTransition(() => resetWatched(videoId))}
      title={watched ? undefined : "まだ視聴していません"}
    >
      {watched ? "未視聴に戻す" : "未視聴"}
    </button>
  );
}

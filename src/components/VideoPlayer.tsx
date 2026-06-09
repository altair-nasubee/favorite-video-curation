"use client";

import { useEffect, useRef, useState } from "react";
import { markWatched } from "@/actions/state-actions";
import { thumbnailUrl } from "@/lib/youtube";
import { PlayIcon } from "./icons";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SCRIPT_ID = "youtube-iframe-api";

/** YouTube IFrame API を一度だけ読み込み、Ready を解決する。 */
function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById(API_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = API_SCRIPT_ID;
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
  });
}

export function VideoPlayer({
  videoId,
  youtubeVideoId,
}: {
  videoId: string;
  youtubeVideoId: string;
}) {
  const [playing, setPlaying] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef(false);

  useEffect(() => {
    if (!playing) return;
    let player: any;
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !mountRef.current) return;
      player = new window.YT.Player(mountRef.current, {
        width: "100%",
        height: "100%",
        videoId: youtubeVideoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (event: any) => {
            // 再生開始（PLAYING = 1）で一度だけ視聴済みを記録
            if (
              event.data === window.YT.PlayerState.PLAYING &&
              !markedRef.current
            ) {
              markedRef.current = true;
              markWatched(videoId);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        player?.destroy?.();
      } catch {
        /* noop */
      }
    };
  }, [playing, videoId, youtubeVideoId]);

  if (!playing) {
    return (
      <div className="player">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl(youtubeVideoId, "maxresdefault")}
          alt=""
          width={1280}
          height={720}
          onError={(e) => {
            e.currentTarget.src = thumbnailUrl(youtubeVideoId, "hqdefault");
          }}
        />
        <button
          className="player__overlay"
          onClick={() => setPlaying(true)}
          aria-label="動画を再生"
        >
          <span className="player__play">
            <PlayIcon size={30} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="player">
      <div ref={mountRef} />
    </div>
  );
}

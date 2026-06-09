"use client";

import { useState, useTransition } from "react";
import { setRating } from "@/actions/state-actions";
import { StarIcon } from "./icons";

export function StarRating({
  videoId,
  value,
}: {
  videoId: string;
  value: number | null;
}) {
  const [current, setCurrent] = useState(value ?? 0);
  const [preview, setPreview] = useState(0);
  const [pending, startTransition] = useTransition();

  function choose(n: number) {
    setCurrent(n);
    startTransition(() => setRating(videoId, n));
  }

  return (
    <div
      className="stars stars--interactive"
      onMouseLeave={() => setPreview(0)}
      role="radiogroup"
      aria-label="評価"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const cls = preview
          ? n <= preview
            ? "is-preview"
            : ""
          : n <= current
            ? "is-on"
            : "";
        return (
          <button
            key={n}
            type="button"
            className={`star ${cls}`}
            aria-label={`${n} つ星`}
            aria-checked={n === current}
            role="radio"
            disabled={pending}
            onMouseEnter={() => setPreview(n)}
            onFocus={() => setPreview(n)}
            onBlur={() => setPreview(0)}
            onClick={() => choose(n)}
          >
            <StarIcon size={26} />
          </button>
        );
      })}
    </div>
  );
}

/** 読み取り専用の星表示。 */
export function StarDisplay({ value }: { value: number | null }) {
  const v = value ?? 0;
  return (
    <div className="stars" aria-label={value ? `評価 ${value}` : "未評価"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`star ${n <= v ? "is-on" : ""}`}>
          <StarIcon size={18} />
        </span>
      ))}
    </div>
  );
}

"use client";

import { deleteVideo } from "@/actions/video-actions";

export function RemoveVideoButton({ id }: { id: string }) {
  return (
    <form
      action={deleteVideo}
      onSubmit={(e) => {
        if (!window.confirm("この動画を削除します。よろしいですか？")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn btn--danger">
        Remove
      </button>
    </form>
  );
}

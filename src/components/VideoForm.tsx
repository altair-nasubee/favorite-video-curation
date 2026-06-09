"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ActionState } from "@/actions/video-actions";
import { ArrowLeftIcon } from "./icons";

type Initial = {
  id?: string;
  category?: string;
  title?: string;
  youtubeUrl?: string;
  isPublic?: boolean;
};

export function VideoForm({
  action,
  categories,
  initial,
  mode,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: string[];
  initial?: Initial;
  mode: "create" | "edit";
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="form">
      {state.error && (
        <div className="form-error" role="alert">
          {state.error}
        </div>
      )}

      {mode === "edit" && initial?.id && (
        <input type="hidden" name="id" value={initial.id} />
      )}

      <div className="field">
        <label className="field__label" htmlFor="category">
          カテゴリ
        </label>
        <input
          id="category"
          name="category"
          className="input"
          list="category-options"
          placeholder="例: ライブ映像 / 料理 / 学習"
          defaultValue={initial?.category ?? ""}
          autoComplete="off"
          spellCheck={false}
          required
        />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="title">
          表示タイトル
        </label>
        <input
          id="title"
          name="title"
          className="input"
          placeholder="一覧に表示するタイトル"
          defaultValue={initial?.title ?? ""}
          autoComplete="off"
          required
        />
      </div>

      {mode === "create" ? (
        <div className="field">
          <label className="field__label" htmlFor="youtubeUrl">
            YouTube 動画 URL
          </label>
          <input
            id="youtubeUrl"
            name="youtubeUrl"
            type="url"
            inputMode="url"
            className="input"
            placeholder="https://www.youtube.com/watch?v=…"
            defaultValue={initial?.youtubeUrl ?? ""}
            autoComplete="off"
            spellCheck={false}
            required
          />
        </div>
      ) : (
        <div className="field">
          <span className="field__label">YouTube 動画 URL（変更不可）</span>
          <input
            className="input"
            value={initial?.youtubeUrl ?? ""}
            readOnly
            disabled
          />
        </div>
      )}

      <div className="field">
        <span className="field__label">公開設定</span>
        <label className="toggle">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={initial?.isPublic ?? true}
          />
          <span className="toggle__track" />
          <span className="toggle__text">公開する（オフで非公開）</span>
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--gold" disabled={pending}>
          {pending ? "保存中…" : "Submit"}
        </button>
        <Link href="/admin" className="btn btn--ghost">
          <ArrowLeftIcon /> Back
        </Link>
      </div>
    </form>
  );
}

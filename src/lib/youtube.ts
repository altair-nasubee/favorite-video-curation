/**
 * YouTube URL / サムネイル / 埋め込み URL に関する純粋関数群。
 * DB・ネットワーク・認証に依存しない（テスト対象: implementation-plan.md §12）。
 */

export type ThumbnailQuality =
  | "default"
  | "mqdefault"
  | "hqdefault"
  | "sddefault"
  | "maxresdefault";

/** YouTube の videoID として妥当な文字種・長さか（11文字の英数字・ハイフン・アンダースコア）。 */
function isValidVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/**
 * 各種 YouTube URL から videoID を抽出する。
 * 対応: watch?v= / youtu.be / embed / shorts、追加パラメータ付き。
 * 抽出できない、または YouTube 以外のホストなら null。
 */
export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

  // youtu.be/<id>
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return isValidVideoId(id) ? id : null;
  }

  // youtube.com 系
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    // watch?v=<id>
    const v = parsed.searchParams.get("v");
    if (v) {
      return isValidVideoId(v) ? v : null;
    }

    // /embed/<id> または /shorts/<id> または /v/<id>
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length >= 2 && ["embed", "shorts", "v"].includes(segments[0])) {
      const id = segments[1];
      return isValidVideoId(id) ? id : null;
    }
    return null;
  }

  return null;
}

/** videoID からサムネイル画像 URL を生成する。 */
export function thumbnailUrl(
  videoId: string,
  quality: ThumbnailQuality = "hqdefault",
): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

/** videoID から JS API 有効化済みの埋め込み URL を生成する。 */
export function embedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
}

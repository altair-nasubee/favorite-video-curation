import { describe, it, expect } from "vitest";
import { extractVideoId, thumbnailUrl, embedUrl } from "@/lib/youtube";

// implementation-plan.md §12.4 — テスト仕様。CLAUDE.md により green 化目的での書き換え禁止。
describe("extractVideoId", () => {
  const VID = "dQw4w9WgXcQ";
  const cases: Array<[string, string | null]> = [
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", VID],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ", VID],
    ["https://youtu.be/dQw4w9WgXcQ", VID],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", VID],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", VID],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s", VID],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxxxx&index=2", VID],
    ["https://youtu.be/dQw4w9WgXcQ?t=42", VID],
    ["http://www.youtube.com/watch?v=dQw4w9WgXcQ", VID],
    ["https://example.com/watch?v=dQw4w9WgXcQ", null],
    ["not a url", null],
    ["", null],
    ["https://www.youtube.com/watch?v=", null],
  ];

  it.each(cases)("extractVideoId(%s) -> %s", (input, expected) => {
    expect(extractVideoId(input)).toBe(expected);
  });
});

// implementation-plan.md §12.5
describe("thumbnailUrl / embedUrl", () => {
  const VID = "dQw4w9WgXcQ";

  it("thumbnailUrl は既定品質で hqdefault を返す", () => {
    expect(thumbnailUrl(VID)).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });

  it("thumbnailUrl は品質指定を反映する", () => {
    expect(thumbnailUrl(VID, "maxresdefault")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    );
  });

  it("embedUrl は enablejsapi=1 を含み embed URL で始まる", () => {
    const url = embedUrl(VID);
    expect(url.startsWith("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(true);
    expect(url).toContain("enablejsapi=1");
  });
});

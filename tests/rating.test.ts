import { describe, it, expect } from "vitest";
import { averageRating, isHighRated } from "@/lib/rating";

// implementation-plan.md §12.6 — テスト仕様。CLAUDE.md により green 化目的での書き換え禁止。
describe("averageRating", () => {
  it("評価なしは null", () => {
    expect(averageRating([])).toBe(null);
  });
  it("1件はその値", () => {
    expect(averageRating([4])).toBe(4);
  });
  it("複数件の平均", () => {
    expect(averageRating([4, 5, 3])).toBe(4);
  });
  it("小数の平均", () => {
    expect(averageRating([5, 4])).toBe(4.5);
  });
});

describe("isHighRated", () => {
  it("0件は対象外で false", () => {
    expect(isHighRated([])).toBe(false);
  });
  it("境界値ちょうど 4.0 は true", () => {
    expect(isHighRated([4])).toBe(true);
  });
  it("平均 4.0 は true", () => {
    expect(isHighRated([3, 5])).toBe(true);
  });
  it("平均 3.5 は false", () => {
    expect(isHighRated([3, 4])).toBe(false);
  });
  it("高評価は true", () => {
    expect(isHighRated([5, 5])).toBe(true);
  });
  it("しきい値を指定できる", () => {
    expect(isHighRated([3], 3.0)).toBe(true);
  });
});

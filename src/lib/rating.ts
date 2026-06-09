/**
 * 評価集計に関する純粋関数群（テスト対象: implementation-plan.md §12）。
 * 「評価の高い動画」カテゴリの判定に用いる。
 */

/** 高評価とみなす平均評価の既定しきい値。 */
export const HIGH_RATING_THRESHOLD = 4.0;

/** 評価の配列から平均を返す。評価0件なら null。 */
export function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return sum / ratings.length;
}

/**
 * 高評価判定。評価が1件以上あり、かつ平均が threshold 以上のとき true。
 * 全ユーザーの評価平均で「評価の高い動画」カテゴリを構成するために使う。
 */
export function isHighRated(
  ratings: number[],
  threshold: number = HIGH_RATING_THRESHOLD,
): boolean {
  const avg = averageRating(ratings);
  if (avg === null) return false;
  return avg >= threshold;
}

import type { Point } from '../types'

/** Above this many points a line is reduced to one point per pixel column (spec 21, ADR-0099). */
export const DOWNSAMPLE_ABOVE = 1000

/**
 * Bucket-max downsampling: one point per pixel column, the largest value of the bucket, so peaks always survive.
 * The kept point is the original one (its real date). A bucket with only nulls stays a gap.
 */
export function downsampleMax(points: Point[], columns: number): Point[] {
  if (points.length <= DOWNSAMPLE_ABOVE || columns < 1 || points.length <= columns) return points
  const size = points.length / columns
  const out: Point[] = []
  for (let c = 0; c < columns; c++) {
    const from = Math.floor(c * size)
    const to = Math.min(points.length, Math.floor((c + 1) * size))
    let best: Point | undefined
    let sawNull: Point | undefined
    for (let i = from; i < to; i++) {
      const p = points[i]!
      if (p.y === null) sawNull ??= p
      else if (!best || p.y > best.y!) best = p
    }
    const kept = best ?? sawNull
    if (kept) out.push(kept)
  }
  return out
}

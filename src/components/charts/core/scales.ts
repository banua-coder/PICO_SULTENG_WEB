import { extent } from 'd3-array'
import { scaleLinear } from 'd3-scale'
import type { IsoDate } from '@/api/types'
import type { Point } from '../types'
import { dayNumber, isoFromDay } from './days'

/** Y domain from 0 to a nice maximum over every visible value. Null-only input gives 0..1. */
export function yDomain(series: Point[][]): [number, number] {
  const values = series.flatMap((s) => s.flatMap((p) => (p.y === null ? [] : [p.y])))
  const [lo, hi] = extent(values)
  if (lo === undefined || hi === undefined) return [0, 1]
  const min = Math.min(0, lo)
  const max = Math.max(hi, min + 1)
  const nice = scaleLinear().domain([min, max]).nice(4).domain()
  return [nice[0]!, nice[1]!]
}

/** 4 to 5 ticks, always including 0 for a non-negative domain. */
export const yTicks = (domain: [number, number]): number[] => scaleLinear().domain(domain).ticks(4)

/**
 * Month ticks (first of the month) for ranges up to about 18 months, year ticks (1 Jan) for longer ones.
 * A tick needs about 56 px, so a narrow chart gets fewer. Ticks lie inside the range.
 */
export function xTicks(range: [IsoDate, IsoDate], width: number): { kind: 'month' | 'year'; ticks: IsoDate[] } {
  const a = dayNumber(range[0])
  const b = dayNumber(range[1])
  const months = (b - a) / 30.44
  const kind = months > 18 ? 'year' : 'month'
  const all: IsoDate[] = []
  const first = new Date(a * 86_400_000)
  let y = first.getUTCFullYear()
  let m = first.getUTCMonth()
  for (;;) {
    const iso = kind === 'year' ? `${y}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
    if (dayNumber(iso) > b) break
    if (dayNumber(iso) >= a) all.push(iso)
    if (kind === 'year') y++
    else {
      m++
      if (m === 12) {
        m = 0
        y++
      }
    }
  }
  const fit = Math.max(1, Math.floor(width / 56))
  const step = Math.max(1, Math.ceil(all.length / fit))
  return { kind, ticks: all.filter((_, i) => i % step === 0) }
}

/** Index of the date nearest to a day number (binary search), or -1 for no dates. `dates` is ascending. */
export function nearestIndex(dates: IsoDate[], day: number): number {
  if (dates.length === 0) return -1
  let lo = 0
  let hi = dates.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (dayNumber(dates[mid]!) < day) lo = mid + 1
    else hi = mid
  }
  if (lo > 0 && day - dayNumber(dates[lo - 1]!) <= dayNumber(dates[lo]!) - day) return lo - 1
  return lo
}

/** Sums of 7 days, each week starting on the first date. A week with no number at all stays null. */
export function weeklySums(points: Point[]): Point[] {
  const out: Point[] = []
  for (let i = 0; i < points.length; i += 7) {
    const week = points.slice(i, i + 7)
    const nums = week.flatMap((p) => (p.y === null ? [] : [p.y]))
    out.push({ x: week[0]!.x, y: nums.length ? nums.reduce((s, n) => s + n, 0) : null })
  }
  return out
}

/**
 * Moves end labels apart so they never overlap: at least `minGap` between neighbours, inside [top, bottom].
 * Returns y per input, in input order.
 */
export function spreadLabels(ys: number[], minGap: number, top: number, bottom: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)
  const pos = order.map((o) => Math.min(Math.max(o.y, top), bottom))
  for (let k = 1; k < pos.length; k++) pos[k] = Math.max(pos[k]!, pos[k - 1]! + minGap)
  // pushed past the bottom: pull the stack back up
  for (let k = pos.length - 1; k >= 0; k--) {
    const limit = k === pos.length - 1 ? bottom : pos[k + 1]! - minGap
    pos[k] = Math.min(pos[k]!, limit)
  }
  const out = new Array<number>(ys.length)
  order.forEach((o, k) => (out[o.i] = pos[k]!))
  return out
}

export { isoFromDay }

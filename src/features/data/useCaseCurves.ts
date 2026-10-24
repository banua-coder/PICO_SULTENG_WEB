import type { AreaLevel, DailyRow, IsoDate } from '@/api/types'
import type { LineSeries } from '@/components/charts/types'
import type { DataWindow } from '@/app/dateWindow'

/** Rows (ascending) inside the window, both ends included. */
export const rowsInWindow = (rows: DailyRow[], w: DataWindow): DailyRow[] => rows.filter((r) => r.date >= w.from && r.date <= w.to)

/**
 * Centred moving average. At the edges the window gets shorter (it never reaches past the data and never counts a missing
 * day as 0). `null` values are skipped, and a position with no value in reach stays `null`. One decimal.
 */
export function movingAverage(values: (number | null)[], radius = 3): (number | null)[] {
  return values.map((_, i) => {
    let sum = 0
    let n = 0
    for (let j = Math.max(0, i - radius); j <= Math.min(values.length - 1, i + radius); j++) {
      const v = values[j]!
      if (v !== null) {
        sum += v
        n++
      }
    }
    return n === 0 ? null : Math.round((sum / n) * 10) / 10
  })
}

export type Labels = { positive: string; recovered: string; deceased: string; active: string; average: string }

/** Peak day of daily positives in the rows (first one on a tie), or null when no day has a case. */
export function peakDay(rows: DailyRow[]): { date: IsoDate; value: number } | null {
  let best: { date: IsoDate; value: number } | null = null
  for (const r of rows) if (r.daily.positive > 0 && (!best || r.daily.positive > best.value)) best = { date: r.date, value: r.daily.positive }
  return best
}

/** What the section draws for a window: both views, the peak, and the last day. Pure. */
export function buildCurves(rows: DailyRow[], window: DataWindow, level: AreaLevel, l: Labels) {
  const w = rowsInWindow(rows, window)
  const pts = (f: (r: DailyRow) => number | null) => w.map((r) => ({ x: r.date, y: f(r) }))
  const dailyPositive: LineSeries = { id: 'positive', role: 'positive', label: l.positive, points: pts((r) => r.daily.positive) }
  const avg = movingAverage(w.map((r) => r.daily.positive))
  const average: LineSeries = { id: 'average', role: 'positive', label: l.average, points: w.map((r, i) => ({ x: r.date, y: avg[i]! })) }
  const dailyLines: LineSeries[] = [
    { id: 'recovered', role: 'recovered', label: l.recovered, points: pts((r) => r.daily.recovered) },
    { id: 'deceased', role: 'deceased', label: l.deceased, points: pts((r) => r.daily.deceased) },
  ]
  const cumulative: LineSeries[] = [
    { id: 'positive', role: 'positive', label: l.positive, points: pts((r) => r.cumulative.positive) },
    { id: 'recovered', role: 'recovered', label: l.recovered, points: pts((r) => r.cumulative.recovered) },
    { id: 'deceased', role: 'deceased', label: l.deceased, points: pts((r) => r.cumulative.deceased) },
    // a kabupaten has no "dirawat" (C2 invariant 4): the series is left out, not drawn as zeros
    ...(level === 'kabupaten' ? [] : [{ id: 'active', role: 'active' as const, label: l.active, points: pts((r) => r.cumulative.active) }]),
  ]
  const last = w.at(-1)
  return {
    rows: w,
    dailyPositive,
    average,
    dailyLines,
    cumulative,
    peak: peakDay(w),
    last: last ? { date: last.date, daily: last.daily.positive, cumulative: last.cumulative.positive } : null,
  }
}

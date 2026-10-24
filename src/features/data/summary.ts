import type { DailyRow, LatestByArea, Series } from '@/api/types'
import type { DataWindow } from './useDataPage'

/** The last row on or before `date`, or undefined. Rows are ascending by date. */
export function rowOnOrBefore(rows: DailyRow[], date: string): DailyRow | undefined {
  let lo = 0
  let hi = rows.length - 1
  let hit: DailyRow | undefined
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (rows[mid]!.date <= date) {
      hit = rows[mid]
      lo = mid + 1
    } else hi = mid - 1
  }
  return hit
}

/**
 * The row the summary shows: with the window ending on the latest day, the small prerendered "latest" row (so the HTML has the
 * numbers and the client needs no request). With a custom end, the series row of that day, once the series has arrived.
 */
export function summaryRow(opts: { latest: LatestByArea | undefined; series: Series | undefined; window: DataWindow; customEnd: boolean }): DailyRow | undefined {
  if (!opts.customEnd) return opts.latest?.latest ?? (opts.series ? rowOnOrBefore(opts.series.rows, opts.window.to) : undefined)
  return opts.series ? rowOnOrBefore(opts.series.rows, opts.window.to) : undefined
}

/** Share of cumulative positive, in percent. Null when nothing is positive yet (never 0 for "unknown"). */
export const rate = (part: number, positive: number): number | null => (positive > 0 ? (part / positive) * 100 : null)

const reported = (o: DailyRow['odp']) => o !== null && [o.active, o.finished, o.total].some((n) => n !== null && n > 0)

/**
 * The newest row that still carries ODP or PDP numbers, for the early-pandemic note. A row of zeros is not a report
 * (C1 Q5: zero means unknown), so an area that never had a non-zero figure gets no note.
 */
export function lastObservationRow(rows: DailyRow[]): DailyRow | undefined {
  for (let i = rows.length - 1; i >= 0; i--) if (reported(rows[i]!.odp) || reported(rows[i]!.pdp)) return rows[i]
  return undefined
}

import type { DailyRow, LatestByArea, Series } from '@/api/types'
import { lastRealRow } from '@/app/homeLatest'
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
 * The row the summary shows. Once the series is here: its row on the window's last day (the last day with real counts, unless the
 * visitor moved the end). Before that, the small prerendered row: for Sulawesi Tengah and Indonesia the last real day (`lastReal`),
 * for any other area the "latest" row with its daily changes withheld, because its date is the padded end of the record, not a report.
 */
export function summaryRow(opts: { latest: LatestByArea | undefined; series: Series | undefined; window: DataWindow; lastReal?: DailyRow | null; /** the window end was moved by the visitor: before the series arrives there is nothing true to show */ customEnd?: boolean }): { row: DailyRow; dailyKnown: boolean } | undefined {
  if (opts.series) {
    // the last day with counts on or before the window end: never one of the zero rows the source padded the record with
    const on = rowOnOrBefore(opts.series.rows, opts.window.to)
    const lastAll = lastRealRow(opts.series.rows)
    const row = on && lastAll && on.date > lastAll.date ? lastAll : on
    return row ? { row, dailyKnown: true } : undefined
  }
  if (opts.customEnd) return undefined
  if (opts.lastReal) return { row: opts.lastReal, dailyKnown: true }
  return opts.latest ? { row: opts.latest.latest, dailyKnown: false } : undefined
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

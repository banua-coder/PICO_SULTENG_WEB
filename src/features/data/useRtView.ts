import type { DailyRow, IsoDate } from '@/api/types'
import type { BandPoint } from '@/components/charts/types'
import type { DataWindow } from '@/app/dateWindow'
import { rowsInWindow } from './useCaseCurves'

export type NullRun = { from: IsoDate; to: IsoDate; /** 'end': it reaches the last day of the record, the estimate stopped */ kind: 'gap' | 'end' }

/** One band point per day of the window. A day without Rt is a gap (`null`), never 0. */
export const rtPoints = (rows: DailyRow[], w: DataWindow): BandPoint[] =>
  rowsInWindow(rows, w).map((r) => (r.rt ? { x: r.date, y: r.rt.value, lo: r.rt.lower, hi: r.rt.upper } : { x: r.date, y: null, lo: null, hi: null }))

/** The newest day in the window that has an Rt, with its interval. */
export function lastRt(rows: DailyRow[], w: DataWindow): { date: IsoDate; value: number; lower: number; upper: number } | null {
  const hit = [...rowsInWindow(rows, w)].reverse().find((r) => r.rt)
  return hit?.rt ? { date: hit.date, ...hit.rt } : null
}

/**
 * Runs of consecutive days without Rt inside the window. A run that reaches the last day of the whole record is the
 * estimate stopping (`end`), not a quiet period.
 */
export function nullRuns(rows: DailyRow[], w: DataWindow, recordLast: IsoDate | undefined = rows.at(-1)?.date): NullRun[] {
  const runs: NullRun[] = []
  let open = null as { from: IsoDate; to: IsoDate } | null
  for (const r of rowsInWindow(rows, w)) {
    if (r.rt) {
      if (open) runs.push({ ...open, kind: 'gap' })
      open = null
    } else open = { from: open?.from ?? r.date, to: r.date }
  }
  if (open) runs.push({ ...open, kind: recordLast !== undefined && open.to >= recordLast ? 'end' : 'gap' })
  return runs
}

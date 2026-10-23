import type { IsoDate } from '@/api/types'
import { dayNumber } from '@/components/charts/core/days'

// The record spans these days for every area that has data. They bound a window before a series has arrived,
// so the prerendered page and the first client render agree.
export const RECORD_FIRST: IsoDate = '2020-03-02'
export const RECORD_LAST: IsoDate = '2024-01-14'

export type DataWindow = { from: IsoDate; to: IsoDate }

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** A real calendar date in YYYY-MM-DD, or undefined (also for arrays, junk and impossible dates like 2021-02-30). */
export function parseIso(v: unknown): IsoDate | undefined {
  const s = Array.isArray(v) ? v[0] : v
  if (typeof s !== 'string' || !ISO.test(s)) return undefined
  const d = new Date(`${s}T00:00:00Z`)
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? undefined : s
}

export const clampDate = (d: IsoDate, lo: IsoDate, hi: IsoDate): IsoDate => (d < lo ? lo : d > hi ? hi : d)

/**
 * Resolve ?dari and ?sampai against the bounds: junk falls back to the bound, out of range clamps, and a start after
 * the end is pulled to the end. Pure, so the cases are unit tested.
 */
export function resolveWindow(query: { dari?: unknown; sampai?: unknown }, bounds: DataWindow): DataWindow {
  const from = clampDate(parseIso(query.dari) ?? bounds.from, bounds.from, bounds.to)
  const to = clampDate(parseIso(query.sampai) ?? bounds.to, bounds.from, bounds.to)
  return from > to ? { from: to, to } : { from, to }
}

export const daysBetween = (a: IsoDate, b: IsoDate) => dayNumber(b) - dayNumber(a)

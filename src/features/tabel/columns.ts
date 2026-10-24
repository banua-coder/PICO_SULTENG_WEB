import type { DailyRow } from '@/api/types'
import type { AreaLevel } from '@/api/types'

// Columns of the daily table (spec 50). The key picks a label (i18n) and a value of a DailyRow.
export type ColumnKey =
  | 'dailyPositive' | 'dailyRecovered' | 'dailyDeceased' | 'dailyActive'
  | 'cumPositive' | 'cumRecovered' | 'cumDeceased' | 'cumActive'
  | 'rt' | 'odp' | 'pdp'
export type ColumnGroup = 'daily' | 'cumulative' | 'rt' | 'observation'
export type Column = {
  key: ColumnKey
  group: ColumnGroup
  state?: 'positive' | 'recovered' | 'deceased' | 'active' | 'rt'
  /** ODP and PDP: the last day with a real report. Later rows hold zeros that are not reports, so they read as "not available". */
  until?: string
}

const DAILY: Column[] = [
  { key: 'dailyPositive', group: 'daily', state: 'positive' },
  { key: 'dailyRecovered', group: 'daily', state: 'recovered' },
  { key: 'dailyDeceased', group: 'daily', state: 'deceased' },
  { key: 'dailyActive', group: 'daily', state: 'active' },
]
const CUMULATIVE: Column[] = [
  { key: 'cumPositive', group: 'cumulative', state: 'positive' },
  { key: 'cumRecovered', group: 'cumulative', state: 'recovered' },
  { key: 'cumDeceased', group: 'cumulative', state: 'deceased' },
  { key: 'cumActive', group: 'cumulative', state: 'active' },
]

/**
 * Columns for a level. A kabupaten has no "dirawat" (C2: active is null). ODP and PDP appear only for a province or kabupaten,
 * and only when the window starts on or before the last day that has ODP/PDP numbers (`observationUntil`).
 */
export function columnsFor(level: AreaLevel, opts: { windowFrom: string; observationUntil: string | null }): Column[] {
  const hideActive = level === 'kabupaten'
  const cols = [...DAILY, ...CUMULATIVE].filter((c) => !(hideActive && c.state === 'active'))
  cols.push({ key: 'rt', group: 'rt', state: 'rt' })
  if (level !== 'indonesia' && opts.observationUntil !== null && opts.windowFrom <= opts.observationUntil) {
    const until = opts.observationUntil
    cols.push({ key: 'odp', group: 'observation', until }, { key: 'pdp', group: 'observation', until })
  }
  return cols
}

/** Number of header cells per group, in order, for the first header row (colspan). */
export function groupSpans(cols: Column[]): { group: ColumnGroup; span: number }[] {
  const out: { group: ColumnGroup; span: number }[] = []
  for (const c of cols) {
    const last = out.at(-1)
    if (last && last.group === c.group) last.span++
    else out.push({ group: c.group, span: 1 })
  }
  return out
}

const NUMERIC: Record<Exclude<ColumnKey, 'rt' | 'odp' | 'pdp'>, (r: DailyRow) => number | null> = {
  dailyPositive: (r) => r.daily.positive,
  dailyRecovered: (r) => r.daily.recovered,
  dailyDeceased: (r) => r.daily.deceased,
  dailyActive: (r) => r.daily.active,
  cumPositive: (r) => r.cumulative.positive,
  cumRecovered: (r) => r.cumulative.recovered,
  cumDeceased: (r) => r.cumulative.deceased,
  cumActive: (r) => r.cumulative.active,
}

/** Raw numeric value of a column; Rt is handled as a triple by the table and the export. */
export function numberFor(c: Column, r: DailyRow): number | null {
  const { key } = c
  if (key === 'rt') return r.rt?.value ?? null
  if (key === 'odp' || key === 'pdp') return c.until !== undefined && r.date > c.until ? null : (r[key]?.total ?? null)
  return NUMERIC[key](r)
}

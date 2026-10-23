import type { AreaRef, DailyRow, Observation, RtPoint, Series } from '../types'
import type { WireNationalCase, WireProvinceCase, WireRegencyCase, WireRt } from '../wire'
import { isoDate } from './date'

/** Rt is a full triple or null. A partial triple, or a 0 triple that stands for "no estimate", is null (C1 Q6). */
export function rtPoint(value: number | null, lower: number | null, upper: number | null): RtPoint {
  if (value === null || lower === null || upper === null) return null
  if (!Number.isFinite(value) || !Number.isFinite(lower) || !Number.isFinite(upper)) return null
  if (value === 0 && lower === 0 && upper === 0) return null
  return { value, lower, upper }
}
const rtFromWire = (r: WireRt): RtPoint => rtPoint(r.value, r.lower_bound, r.upper_bound)

/**
 * Sort ascending by calendar date and drop duplicate dates, keeping the LAST row served for a date.
 * Never uses `day` (C1 Q1, Q2): it is not chronological and disagrees across tables.
 */
export function byDateAscending(rows: DailyRow[]): DailyRow[] {
  const byDate = new Map<string, DailyRow>()
  for (const r of rows) byDate.set(r.date, r) // later rows overwrite earlier ones
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

function toSeries(area: AreaRef, rows: DailyRow[]): Series {
  const sorted = byDateAscending(rows)
  return { area, rows: sorted, first: sorted[0]?.date ?? '', last: sorted.at(-1)?.date ?? '' }
}

export function nationalSeries(area: AreaRef, wire: WireNationalCase[]): Series {
  return toSeries(
    area,
    wire.map((w) => ({
      date: isoDate(w.date),
      daily: { ...w.daily },
      cumulative: { ...w.cumulative },
      rt: rtFromWire(w.statistics.reproduction_rate),
      odp: null,
      pdp: null,
    })),
  )
}

const hasNonZero = (o: { active: number; finished: number; total?: number }) => o.active !== 0 || o.finished !== 0 || (o.total ?? 0) !== 0

/**
 * Province rows return 0, not null, for ODP/PDP after the source stopped (C1 Q5). The last date with any
 * non-zero ODP/PDP figure is the cut-off: later dates are null, earlier dates keep their numbers.
 */
export function provinceSeries(area: AreaRef, wire: WireProvinceCase[]): Series {
  let cutoff = ''
  for (const w of wire) {
    const d = isoDate(w.date)
    const live = hasNonZero(w.daily.odp) || hasNonZero(w.daily.pdp) || hasNonZero(w.cumulative.odp) || hasNonZero(w.cumulative.pdp)
    if (live && d > cutoff) cutoff = d
  }
  const obs = (o: { active: number; finished: number; total: number }, d: string): Observation | null =>
    d > cutoff ? null : { active: o.active, finished: o.finished, total: o.total }
  return toSeries(
    area,
    wire.map((w) => {
      const date = isoDate(w.date)
      const { odp: _o, pdp: _p, ...daily } = w.daily
      const { odp: co, pdp: cp, ...cumulative } = w.cumulative
      return {
        date,
        daily: { ...daily },
        cumulative: { ...cumulative },
        rt: rtFromWire(w.statistics.reproduction_rate),
        odp: cutoff === '' ? null : obs(co, date),
        pdp: cutoff === '' ? null : obs(cp, date),
      }
    }),
  )
}

const obsFromRegency = (total: number | null, finished: number | null): Observation | null =>
  total === null && finished === null ? null : { active: null, finished, total }

/** Kabupaten rows are flat, carry no `active` (so it stays null, never computed), and send null for ODP/PDP themselves. */
export function regencyRow(w: WireRegencyCase): DailyRow {
  return {
    date: isoDate(w.date),
    daily: { positive: w.positive, recovered: w.recovered, deceased: w.deceased, active: null },
    cumulative: { positive: w.cumulative_positive, recovered: w.cumulative_recovered, deceased: w.cumulative_deceased, active: null },
    rt: rtPoint(w.rt, w.rt_lower, w.rt_upper),
    odp: obsFromRegency(w.cumulative_person_under_observation, w.cumulative_finished_person_under_observation),
    pdp: obsFromRegency(w.cumulative_person_under_supervision, w.cumulative_finished_person_under_supervision),
  }
}

export const regencySeries = (area: AreaRef, wire: WireRegencyCase[]): Series => toSeries(area, wire.map(regencyRow))

/** One latest row for the province list (`/provinces`). Its ODP/PDP are not cut off: a single row has no series to judge by. */
export function provinceLatestRow(w: WireProvinceCase): DailyRow {
  const { odp: _o, pdp: _p, ...daily } = w.daily
  const { odp: co, pdp: cp, ...cumulative } = w.cumulative
  return {
    date: isoDate(w.date),
    daily: { ...daily },
    cumulative: { ...cumulative },
    rt: rtFromWire(w.statistics.reproduction_rate),
    // all zero means "unknown" (Q5), so it is null rather than a 0 that reads as a count
    odp: hasNonZero(co) ? { active: co.active, finished: co.finished, total: co.total } : null,
    pdp: hasNonZero(cp) ? { active: cp.active, finished: cp.finished, total: cp.total } : null,
  }
}

export function nationalLatestRow(w: WireNationalCase): DailyRow {
  return nationalSeries({ level: 'indonesia', code: '0', slug: 'indonesia', name: 'Indonesia' }, [w]).rows[0]!
}

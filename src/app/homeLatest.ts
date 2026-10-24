import type { DailyRow, HomeLatest, Infographic, RtLast, VaccinationDay } from '@/api/types'

/** The newest day that has an Rt (never a 0 for a missing one). */
export function lastRtOf(rows: DailyRow[]): RtLast | null {
  const hit = [...rows].reverse().find((r) => r.rt)
  return hit?.rt ? { date: hit.date, ...hit.rt } : null
}

/** True when a row carries real counts: something was reported that day. The API pads the end of a series with zero rows (C1). */
export const hasRealCounts = (r: DailyRow): boolean => r.daily.positive > 0 || r.daily.recovered > 0 || r.daily.deceased > 0

/** The newest row with real counts, or undefined. Rows are ascending by date. */
export function lastRealRow(rows: DailyRow[]): DailyRow | undefined {
  for (let i = rows.length - 1; i >= 0; i--) if (hasRealCounts(rows[i]!)) return rows[i]
  return undefined
}

/** How many infographics the home page shows. */
export const HOME_INFOGRAPHICS = 5

/** Build-time cut of the big series for the home page. Pure, so the build script and the tests share it. */
export function buildHomeLatest(input: {
  national: DailyRow[]
  sulteng: DailyRow[]
  vaccination: { indonesia: VaccinationDay[]; 'sulawesi-tengah': VaccinationDay[] }
  infographics: Infographic[]
}): HomeLatest {
  return {
    rt: { indonesia: lastRtOf(input.national), 'sulawesi-tengah': lastRtOf(input.sulteng) },
    lastReal: { indonesia: lastRealRow(input.national) ?? null, 'sulawesi-tengah': lastRealRow(input.sulteng) ?? null },
    vaccination: { indonesia: input.vaccination.indonesia.at(-1) ?? null, 'sulawesi-tengah': input.vaccination['sulawesi-tengah'].at(-1) ?? null },
    observation: ((r) => (r ? { date: r.date, odp: r.odp, pdp: r.pdp } : null))(lastObservationRow(input.sulteng)),
    infographics: [...input.infographics].sort((a, b) => b.id - a.id).slice(0, HOME_INFOGRAPHICS),
  }
}

const reported = (o: DailyRow['odp']) => o !== null && [o.active, o.finished, o.total].some((n) => n !== null && n > 0)

/**
 * The newest row that still carries ODP or PDP numbers, for the early-pandemic note. A row of zeros is not a report
 * (C1 Q5: zero means unknown), so an area that never had a non-zero figure gets no note.
 */
export function lastObservationRow(rows: DailyRow[]): DailyRow | undefined {
  for (let i = rows.length - 1; i >= 0; i--) if (reported(rows[i]!.odp) || reported(rows[i]!.pdp)) return rows[i]
  return undefined
}

/**
 * Map date rule: an area's number on the map is its cumulative total on its own last real day (the last day with a positive, recovered or
 * deceased count above 0, the same rule as the cards). The source pads every series to 14 January 2024 with zero rows; they add nothing to the
 * cumulative total (checked for all 34 provinces, 13 kabupaten/kota and Indonesia), so the numbers are right and only the date needs this rule.
 * A few areas really report on 14 January (recovered +22 in Banggai, +38 Sumatera Barat, +490 Gorontalo): for them the rule keeps that day.
 */
export type LastRealDates = { provinsi: Record<string, string>; kabupaten: Record<string, string> }
export const lastRealDate = (rows: DailyRow[]): string | undefined => lastRealRow(rows)?.date

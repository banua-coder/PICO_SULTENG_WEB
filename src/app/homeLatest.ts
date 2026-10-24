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
    infographics: [...input.infographics].sort((a, b) => b.id - a.id).slice(0, HOME_INFOGRAPHICS),
  }
}

import type { DailyRow, HomeLatest, Infographic, RtLast, VaccinationDay } from '@/api/types'

/** The newest day that has an Rt (never a 0 for a missing one). */
export function lastRtOf(rows: DailyRow[]): RtLast | null {
  const hit = [...rows].reverse().find((r) => r.rt)
  return hit?.rt ? { date: hit.date, ...hit.rt } : null
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
    vaccination: { indonesia: input.vaccination.indonesia.at(-1) ?? null, 'sulawesi-tengah': input.vaccination['sulawesi-tengah'].at(-1) ?? null },
    infographics: [...input.infographics].sort((a, b) => b.id - a.id).slice(0, HOME_INFOGRAPHICS),
  }
}

import type { AreaRef, DailyRow, IsoDate } from '@/api/types'

export type NewCaseItem = { code: string; name: string; positive: number | null; recovered: number | null; deceased: number | null }
export type NewCasesDay = { date: IsoDate; items: NewCaseItem[] }

/**
 * The legacy "Perubahan data di kabupaten/kota" chart: every area's new cases on ONE day, the last day on which any area reported a
 * new positive (the record's last rows are zeros the source padded, not reports). An area without a row that day is null, never 0.
 * Shared by the build script (public/data/kabupaten-newcases.json) and the tests.
 */
export function newCasesDay(series: { area: AreaRef; rows: DailyRow[] }[]): NewCasesDay | null {
  const date = series.flatMap((s) => s.rows.filter((r) => r.daily.positive > 0).map((r) => r.date)).sort().at(-1)
  if (!date) return null
  return {
    date,
    items: series.map(({ area, rows }) => {
      const d = rows.find((r) => r.date === date)?.daily
      return { code: area.code, name: area.name, positive: d?.positive ?? null, recovered: d?.recovered ?? null, deceased: d?.deceased ?? null }
    }),
  }
}

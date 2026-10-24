import type { AreaLevel, AreaRef, LatestByArea } from '@/api/types'
import type { LastRealDates } from '@/app/homeLatest'
import type { MapItem } from '@/components/maps/types'
import { SULTENG } from '@/app/areas'

export type MapMetricKey = 'positive' | 'active' | 'recovered' | 'deceased'
/** The legacy order of the cases: Positif, Dirawat, Sembuh, Meninggal. */
export const MAP_METRICS: MapMetricKey[] = ['positive', 'active', 'recovered', 'deceased']
export type MapKind = 'provinces' | 'kabupaten'

/**
 * Latest cumulative value of a metric per area, as map and table items, with the four numbers for the tooltip. Pure.
 * A kabupaten has no "dirawat": its value is null (not available), never 0.
 */
export const useSubAreaItems = (latest: LatestByArea[], metric: MapMetricKey, dates?: Record<string, string>): MapItem[] =>
  latest.map((l) => {
    const c = l.latest.cumulative
    // the area's own last real day (map date rule, src/app/homeLatest.ts); the row's date only when the build file has none for it
    return { code: l.area.code, name: l.area.name, value: c[metric] ?? null, date: dates?.[l.area.code] ?? l.latest.date, detail: { positive: c.positive, active: c.active ?? null, recovered: c.recovered, deceased: c.deceased } }
  })

/**
 * Which maps a Data page gets, by level: the country the 34 provinces; a province the 34 provinces with itself marked
 * (Sulawesi Tengah also the 13 kabupaten/kota); a kabupaten/kota the 13 kabupaten/kota. The kabupaten maps exist for Sulawesi Tengah only.
 */
export function mapKinds(area: AreaRef): MapKind[] {
  if (area.level === 'kabupaten') return ['kabupaten']
  return area.level === 'provinsi' && area.code === SULTENG.code ? ['provinces', 'kabupaten'] : ['provinces']
}

/** Metrics a set of maps can show: "dirawat" needs the province map. */
export const metricsFor = (kinds: MapKind[]): MapMetricKey[] => (kinds.includes('provinces') ? MAP_METRICS : MAP_METRICS.filter((m) => m !== 'active'))

/** The area to mark on a map: the current province on the province map, the current kabupaten on the kabupaten map. */
export const selectedCode = (area: AreaRef, kind: MapKind): string | undefined =>
  kind === 'provinces' ? (area.level === 'provinsi' ? area.code : undefined) : area.level === 'kabupaten' ? area.code : undefined

/** The last-real-day table of one level of the build file (public/data/last-real.json). */
export const datesFor = (all: LastRealDates | undefined, level: Extract<AreaLevel, 'provinsi' | 'kabupaten'>): Record<string, string> | undefined => all?.[level]

/**
 * The dates on a map: from the oldest to the newest last real day of its areas. The source pads every series to 14 January 2024 with zero rows,
 * so that day is not the date of the numbers; each area keeps its own day (table column and tooltip), the caption gives the range.
 */
export function mapDateRange(items: MapItem[]): { from: string; to: string } | undefined {
  const d = items.flatMap((i) => (i.date ? [i.date] : [])).sort()
  return d.length ? { from: d[0]!, to: d.at(-1)! } : undefined
}

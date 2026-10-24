import type { AreaRef, LatestByArea } from '@/api/types'
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
export const useSubAreaItems = (latest: LatestByArea[], metric: MapMetricKey): MapItem[] =>
  latest.map((l) => {
    const c = l.latest.cumulative
    return { code: l.area.code, name: l.area.name, value: c[metric] ?? null, detail: { positive: c.positive, active: c.active ?? null, recovered: c.recovered, deceased: c.deceased } }
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

/** Date of the data on the map (the newest `latest` row). */
export const mapDate = (latest: LatestByArea[]): string | undefined => latest.map((l) => l.latest.date).sort().at(-1)

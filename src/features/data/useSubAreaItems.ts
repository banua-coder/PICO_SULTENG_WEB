import type { AreaRef, LatestByArea } from '@/api/types'
import type { MapItem } from '@/components/maps/types'
import { SULTENG } from '@/app/areas'

export type MapMetricKey = 'positive' | 'deceased' | 'recovered'

/** Latest cumulative value of a metric per area, as map and table items. Pure. */
export const useSubAreaItems = (latest: LatestByArea[], metric: MapMetricKey): MapItem[] =>
  latest.map((l) => ({ code: l.area.code, name: l.area.name, value: l.latest.cumulative[metric] }))

/** Which map a Data page gets (spec 40): the provinces for the country, the 13 kabupaten for Sulawesi Tengah and its kabupaten, none otherwise. */
export function mapKind(area: AreaRef): 'provinces' | 'kabupaten' | null {
  if (area.level === 'indonesia') return 'provinces'
  if (area.level === 'kabupaten' || area.code === SULTENG.code) return 'kabupaten'
  return null
}

/** The area to mark on the map: the current kabupaten, nothing on the province pages. */
export const selectedCode = (area: AreaRef): string | undefined => (area.level === 'kabupaten' ? area.code : undefined)

/** Date of the data on the map (the newest `latest` row). */
export const mapDate = (latest: LatestByArea[]): string | undefined => latest.map((l) => l.latest.date).sort().at(-1)

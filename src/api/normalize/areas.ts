import { areaByCode, INDONESIA } from '@/app/areas'
import type { LatestByArea } from '../types'
import type { WireNationalCase, WireProvince, WireRegency } from '../wire'
import { nationalLatestRow, provinceLatestRow, regencyRow } from './series'

/** `/provinces` -> 34 rows with the latest case. Provinces missing from the slug table are dropped (C5 decides). */
export function provincesLatest(wire: WireProvince[]): LatestByArea[] {
  return wire.flatMap((p) => {
    const area = areaByCode('provinsi', p.id)
    return area && p.latest_case ? [{ area, latest: provinceLatestRow(p.latest_case) }] : []
  })
}

/**
 * Kabupaten latest from `/regencies?include_latest_case=true` (API PR #91, not deployed everywhere yet).
 * A regency with `latest_case: null` is left out. The web falls back to the build-time snapshot otherwise (C2).
 */
export function kabupatenLatest(wire: WireRegency[]): LatestByArea[] {
  return wire.flatMap((r) => {
    const area = areaByCode('kabupaten', r.id)
    return area && r.latest_case ? [{ area, latest: regencyRow(r.latest_case) }] : []
  })
}

export const nationalLatest = (wire: WireNationalCase): LatestByArea => ({ area: INDONESIA, latest: nationalLatestRow(wire) })


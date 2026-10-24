import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { INDONESIA } from '@/app/areas'
import type { LastRealDates } from '@/app/homeLatest'
import { fetchJson, fetchStatic } from './client'
import { ENDPOINTS } from './endpoints'
import { isArrayOf, isRecord, isWireNationalCase, isWireProvince, isWireProvinceCase, isWireRegency, isWireRegencyCase } from './guards'
import { kabupatenLatest, nationalLatest, provincesLatest } from './normalize/areas'
import { nationalSeries, provinceSeries, regencySeries } from './normalize/series'
import { useResource } from './resource'
import type { AreaRef, HomeLatest, LatestByArea, Resource, Series } from './types'

/**
 * URL of a series. Plain paths only: no `sort`, no `start_date`/`end_date`.
 * The API ignored `sort` and compared instants for dates until PR #91, and the web filters by calendar date client-side anyway.
 */
export function seriesPath(area: AreaRef): string {
  if (area.level === 'indonesia') return ENDPOINTS.national.path
  if (area.level === 'provinsi') return `/provinces/${area.code}/cases?all=true`
  return `/regencies/${area.code}/cases`
}

export function useAreaSeries(area: MaybeRefOrGetter<AreaRef>): Resource<Series> {
  return useResource<Series>(
    () => seriesPath(toValue(area)),
    (signal) => {
      const a = toValue(area)
      if (a.level === 'indonesia') return fetchJson(seriesPath(a), { signal, guard: isArrayOf(isWireNationalCase) }).then((w) => nationalSeries(a, w))
      if (a.level === 'provinsi') return fetchJson(seriesPath(a), { signal, guard: isArrayOf(isWireProvinceCase) }).then((w) => provinceSeries(a, w))
      return fetchJson(seriesPath(a), { signal, guard: isArrayOf(isWireRegencyCase) }).then((w) => regencySeries(a, w))
    },
    { series: true },
  )
}

export const useNationalSeries = (): Resource<Series> => useAreaSeries(INDONESIA)

export function useProvincesLatest(): Resource<LatestByArea[]> {
  return useResource(ENDPOINTS.provinces.path, (signal) => fetchJson(ENDPOINTS.provinces.path, { signal, guard: isArrayOf(isWireProvince) }).then(provincesLatest))
}

const isLatestByArea = (v: unknown): v is LatestByArea => isRecord(v) && isRecord(v.area) && isRecord(v.latest) && typeof v.latest.date === 'string'

/** Where the 13 latest rows come from. 'snapshot' (default) is the build-time file of spec 15. 'api' uses `/regencies?include_latest_case=true`. */
export const KABUPATEN_LATEST_SOURCE: 'snapshot' | 'api' = import.meta.env?.VITE_REGENCY_LATEST === 'api' ? 'api' : 'snapshot'
export const KABUPATEN_SNAPSHOT_URL = `${import.meta.env?.BASE_URL ?? '/'}data/kabupaten-latest.json`
export const KABUPATEN_API_PATH = '/regencies?load_all=true&include_latest_case=true'

export function kabupatenLatestLoader(source: 'snapshot' | 'api' = KABUPATEN_LATEST_SOURCE) {
  return (signal: AbortSignal): Promise<LatestByArea[]> =>
    source === 'api'
      ? fetchJson(KABUPATEN_API_PATH, { signal, guard: isArrayOf(isWireRegency) }).then(kabupatenLatest)
      : fetchStatic(KABUPATEN_SNAPSHOT_URL, { signal, guard: isArrayOf(isLatestByArea) })
}

export function useKabupatenLatest(): Resource<LatestByArea[]> {
  return useResource(KABUPATEN_LATEST_SOURCE === 'api' ? KABUPATEN_API_PATH : KABUPATEN_SNAPSHOT_URL, kabupatenLatestLoader())
}

/** The latest national row (`/national/latest`), small enough for the prerender's initial state. */
export function useNationalLatest(): Resource<LatestByArea> {
  const p = ENDPOINTS.nationalLatest.path
  return useResource(p, (signal) => fetchJson(p, { signal, guard: isWireNationalCase }).then(nationalLatest))
}

export const HOME_LATEST_URL = `${import.meta.env?.BASE_URL ?? '/'}data/home-latest.json`

/** The build-time cut for the home page (last Rt, last vaccination day, newest infographics). Seeded into the prerender. */
export function useHomeLatest(): Resource<HomeLatest> {
  return useResource(HOME_LATEST_URL, (signal) => fetchStatic<HomeLatest>(HOME_LATEST_URL, { signal, guard: isRecord as (v: unknown) => v is HomeLatest }))
}

export const LAST_REAL_URL = `${import.meta.env?.BASE_URL ?? '/'}data/last-real.json`

/** Last real day of each province and kabupaten (build-time file, public/data/last-real.json), for the map dates. Seeded into the prerender. */
export function useLastReal(): Resource<LastRealDates> {
  return useResource(LAST_REAL_URL, (signal) => fetchStatic<LastRealDates>(LAST_REAL_URL, { signal, guard: isRecord as (v: unknown) => v is LastRealDates }))
}

export type DownloadSizes = Record<string, { csv: number; xlsx: number }>
export const DOWNLOAD_SIZES_URL = `${import.meta.env?.BASE_URL ?? '/'}unduh/sizes.json`

/** Byte sizes of the prebuilt download files, written by scripts/build-downloads.ts. Small, so it is seeded into the prerender. */
export function useDownloadSizes(): Resource<DownloadSizes> {
  return useResource(DOWNLOAD_SIZES_URL, (signal) => fetchStatic<DownloadSizes>(DOWNLOAD_SIZES_URL, { signal, guard: isRecord as (v: unknown) => v is DownloadSizes }))
}

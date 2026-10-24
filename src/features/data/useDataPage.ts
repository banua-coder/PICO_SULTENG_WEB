import { computed } from 'vue'
import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAreaSeries } from '@/api/useSeries'
import type { AreaRef, Resource, Series } from '@/api/types'
import { useLocale } from '@/app/useLocale'
import { lastRealRow } from '@/app/homeLatest'
import { clampDate, daysBetween, parseIso, RECORD_FIRST, RECORD_LAST, resolveWindow } from '@/app/dateWindow'
import type { DataWindow } from '@/app/dateWindow'

export { RECORD_FIRST, RECORD_LAST }
export type { DataWindow }
export type DataView = 'harian' | 'kumulatif'
export type CaseType = 'positive' | 'recovered' | 'deceased' | 'all'
export const CASE_TYPES: CaseType[] = ['positive', 'recovered', 'deceased', 'all']

/** Contract of spec 40: sections read the page only through this state. */
export type DataPageState = {
  area: ComputedRef<AreaRef>
  window: ComputedRef<DataWindow>
  /** the earliest and latest day the window can take: the series range once loaded, else the record */
  bounds: ComputedRef<DataWindow>
  /** true when ?sampai moves the window end away from the latest day */
  customEnd: ComputedRef<boolean>
  view: ComputedRef<DataView>
  /** which case type the curves show (?jenis) */
  caseType: ComputedRef<CaseType>
  series: Resource<Series>
  setWindow: (w: DataWindow) => void
  setView: (v: DataView) => void
  setCaseType: (c: CaseType) => void
}
export const DataPageKey: InjectionKey<DataPageState> = Symbol('pico-data-page')

export const parseCaseType = (v: unknown): CaseType => {
  const x = Array.isArray(v) ? v[0] : v
  return CASE_TYPES.includes(x as CaseType) ? (x as CaseType) : 'positive'
}

export const parseView = (v: unknown): DataView => ((Array.isArray(v) ? v[0] : v) === 'kumulatif' ? 'kumulatif' : 'harian')

export { parseIso, clampDate, resolveWindow, daysBetween }

/** Path of an area's page (C5). Sulawesi Tengah has its own page, /data is the same view. */
export function areaPath(area: AreaRef): string {
  if (area.level === 'indonesia') return '/data/indonesia'
  return `/data/${area.level === 'provinsi' ? 'provinsi' : 'kabupaten'}/${area.slug}`
}

/**
 * Route and query to typed page state (spec 41). Writes use router.replace and leave default values out of the URL,
 * so the back button leaves the page instead of stepping through window changes.
 */
export function useDataPage(areaSource: MaybeRefOrGetter<AreaRef>): DataPageState {
  const route = useRoute()
  const router = useRouter()
  const area = computed(() => toValue(areaSource))
  const series = useAreaSeries(area)

  const bounds = computed<DataWindow>(() => {
    const s = series.data.value
    // the window ends on the last day with real counts: after it the source padded the series with zero rows, which are not reports
    return s && s.rows.length ? { from: s.first, to: lastRealRow(s.rows)?.date ?? s.last } : { from: RECORD_FIRST, to: RECORD_LAST }
  })
  const window = computed(() => resolveWindow(route.query, bounds.value))
  const customEnd = computed(() => window.value.to !== bounds.value.to)
  const view = computed(() => parseView(route.query.tampilan))
  const caseType = computed(() => parseCaseType(route.query.jenis))

  const write = (patch: Record<string, string | undefined>) => {
    const query = { ...route.query }
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) delete query[k]
      else query[k] = v
    }
    void router.replace({ query })
  }

  return {
    area,
    window,
    bounds,
    customEnd,
    view,
    caseType,
    series,
    setWindow: (w) => {
      const b = bounds.value
      write({ dari: w.from <= b.from ? undefined : w.from, sampai: w.to >= b.to ? undefined : w.to })
    },
    setView: (v) => write({ tampilan: v === 'harian' ? undefined : v }),
    setCaseType: (c) => write({ jenis: c === 'positive' ? undefined : c }),
  }
}

export { useLocale }

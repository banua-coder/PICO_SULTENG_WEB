import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAreaSeries } from '@/api/useSeries'
import type { AreaLevel, AreaRef, DailyRow } from '@/api/types'
import { areaBySlug, INDONESIA, SULTENG } from '@/app/areas'
import { lastRealRow } from '@/app/homeLatest'
import { RECORD_FIRST, RECORD_LAST, resolveWindow } from '@/app/dateWindow'
import { clampPage, pageOfDate, PAGE_SIZE, pageCount, parsePage, slicePage } from './paging'
import { columnsFor } from './columns'

const LEVELS: AreaLevel[] = ['indonesia', 'provinsi', 'kabupaten']
const DEFAULT_SLUG: Record<AreaLevel, string> = { indonesia: 'indonesia', provinsi: 'sulawesi-tengah', kabupaten: 'kota-palu' }
const first = (v: unknown) => (Array.isArray(v) ? v[0] : v)

export const parseLevel = (v: unknown): AreaLevel => (LEVELS.find((l) => l === first(v)) ?? 'provinsi')

/** Area for ?tingkat and ?wilayah. A slug that does not belong to the level falls back to that level's default (C5). */
export function resolveArea(level: AreaLevel, slug: unknown): AreaRef {
  if (level === 'indonesia') return INDONESIA
  const s = first(slug)
  return (typeof s === 'string' ? areaBySlug(level, s) : undefined) ?? areaBySlug(level, DEFAULT_SLUG[level]) ?? SULTENG
}

/** Last day with a real ODP/PDP number. A row of zeros is not a report (see summary.ts in the Data page). */
export function observationUntil(rows: DailyRow[]): string | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i]!
    if ((r.odp?.total ?? 0) > 0 || (r.pdp?.total ?? 0) > 0) return r.date
  }
  return null
}

/** Query state of the Tabel Data page (spec 50, C5), the filtered rows newest first, and one page of them. Writes use router.replace. */
export function useTabelPage() {
  const route = useRoute()
  const router = useRouter()
  const level = computed(() => parseLevel(route.query.tingkat))
  const area = computed(() => resolveArea(level.value, route.query.wilayah))
  const series = useAreaSeries(area)

  const bounds = computed(() => {
    const s = series.data.value
    return s && s.rows.length ? { from: s.first, to: lastRealRow(s.rows)?.date ?? s.last } : { from: RECORD_FIRST, to: RECORD_LAST }
  })
  const window = computed(() => resolveWindow(route.query, bounds.value))
  const rows = computed<DailyRow[]>(() => {
    const s = series.data.value
    if (!s) return []
    const { from, to } = window.value
    return s.rows.filter((r) => r.date >= from && r.date <= to).reverse()
  })
  const pages = computed(() => pageCount(rows.value.length))
  const page = computed(() => clampPage(parsePage(route.query.hal), rows.value.length))
  const pageRows = computed(() => slicePage(rows.value, page.value))
  const columns = computed(() => columnsFor(level.value, { windowFrom: window.value.from, observationUntil: observationUntil(series.data.value?.rows ?? []) }))

  function write(patch: Record<string, string | undefined>) {
    const query = { ...route.query }
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) delete query[k]
      else query[k] = v
    }
    void router.replace({ query })
  }
  const setPage = (n: number) => write({ hal: n <= 1 ? undefined : String(n) })

  return {
    level,
    area,
    series,
    bounds,
    window,
    rows,
    pages,
    page,
    pageRows,
    columns,
    pageSize: PAGE_SIZE,
    setLevel: (l: AreaLevel) => write({ tingkat: l === 'provinsi' ? undefined : l, wilayah: undefined, hal: undefined }),
    setArea: (a: AreaRef) => write({ tingkat: a.level === 'provinsi' ? undefined : a.level, wilayah: a.slug === DEFAULT_SLUG[a.level] ? undefined : a.slug, hal: undefined }),
    setWindow: (w: { from: string; to: string }) => {
      const b = bounds.value
      write({ dari: w.from <= b.from ? undefined : w.from, sampai: w.to >= b.to ? undefined : w.to, hal: undefined })
    },
    setPage,
    jumpTo: (date: string) => setPage(pageOfDate(rows.value, date)),
  }
}

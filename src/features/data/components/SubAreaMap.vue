<script setup lang="ts">
import { computed, defineAsyncComponent, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useKabupatenLatest, useLastReal, useProvincesLatest } from '@/api/useSeries'
import type { LatestByArea, Resource } from '@/api/types'
import { areaByCode, INDONESIA, SULTENG } from '@/app/areas'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import OptionToggle from '@/components/OptionToggle.vue'
import type { MapMode } from '@/components/maps/types'
import SectionHeading from '@/components/SectionHeading.vue'
import StatusView from '@/components/StatusView.vue'
import { areaPath, DataPageKey } from '../useDataPage'
import { datesFor, mapDateRange, mapKinds, metricsFor, selectedCode, useSubAreaItems } from '../useSubAreaItems'
import type { MapKind, MapMetricKey } from '../useSubAreaItems'

// Spec 44, ported from the legacy map card: "Sebaran" (areas filled by class) or "Titik" (proportional marks), one of the four cases.
// The map shows the latest values (a small prerendered resource), not the date window, and says so.
// The map code and its path data load as a chunk of their own.
const KabupatenMap = defineAsyncComponent(() => import('@/components/maps/KabupatenMap.vue'))
const ProvinceMap = defineAsyncComponent(() => import('@/components/maps/ProvinceMap.vue'))
const state = inject(DataPageKey)!
const { t } = useI18n()
const f = useFormat()
const route = useRoute()
const router = useRouter()
const { localize } = useLocale()

const area = state.area.value // DataView keys the page by area
const kinds = mapKinds(area)
const loaders: Record<MapKind, Resource<LatestByArea[]> | null> = {
  provinces: kinds.includes('provinces') ? useProvincesLatest() : null,
  kabupaten: kinds.includes('kabupaten') ? useKabupatenLatest() : null,
}
const lastReal = useLastReal()
const metric = ref<MapMetricKey>('positive')
const mode = ref<MapMode>('choropleth')
const metrics = metricsFor(kinds)

const LEVEL = { provinces: 'provinsi', kabupaten: 'kabupaten' } as const
const blocks = computed(() =>
  kinds.map((kind) => {
    const res = loaders[kind]!
    const rows = res.data.value ?? []
    // no "dirawat" for a kabupaten: the block says so instead of drawing an empty map
    const noActive = kind === 'kabupaten' && metric.value === 'active'
    const items = useSubAreaItems(rows, metric.value, datesFor(lastReal.data.value, LEVEL[kind]))
    const range = mapDateRange(items)
    return {
      kind,
      res,
      rows,
      noActive,
      items,
      date: range?.from,
      dateEnd: range?.to,
      areaName: kind === 'provinces' ? INDONESIA.name : SULTENG.name,
      pin: kind === 'provinces' ? SULTENG.code : undefined,
      selected: selectedCode(area, kind),
    }
  }),
)
// one caption for the page's maps: the oldest and the newest last real day of any area on them
const range = computed(() => {
  const d = blocks.value.flatMap((b) => [b.date, b.dateEnd].filter((x): x is string => !!x)).sort()
  return d.length ? { from: d[0]!, to: d.at(-1)! } : undefined
})
const metricProp = computed(() => ({ label: t(`data.map.${metric.value}`), role: metric.value }))

// choosing an area goes to its page and keeps the date window and the view (?dari, ?sampai, ?tampilan)
const hrefFor = (kind: MapKind) => (code: string): string => {
  const a = areaByCode(LEVEL[kind], code)
  const qs = new URLSearchParams(Object.entries(route.query).flatMap(([k, v]) => (typeof v === 'string' ? [[k, v]] : []))).toString()
  return a ? `${localize(areaPath(a))}${qs ? `?${qs}` : ''}` : '#'
}
const select = (kind: MapKind, code: string) => void router.push(hrefFor(kind)(code))
</script>

<template>
  <section aria-labelledby="peta" data-testid="submap">
    <SectionHeading id="peta" :level="2">{{ t('data.map.title') }}</SectionHeading>
    <div class="mt-3 flex flex-wrap gap-x-8 gap-y-3">
      <OptionToggle v-model="metric" :options="metrics.map((m) => ({ value: m, label: t(`data.map.${m}`) }))" :label="t('data.map.metric')" />
      <OptionToggle v-model="mode" :options="[{ value: 'choropleth', label: t('data.map.modeFill') }, { value: 'points', label: t('data.map.modePoints') }]" :label="t('data.map.mode')" />
    </div>
    <p v-if="!metrics.includes('active')" class="mt-2 text-sm text-ink-muted" data-testid="map-no-active">{{ t('data.map.noActiveKab') }}</p>
    <p v-if="range" class="mt-2 text-sm text-ink-muted" data-testid="map-caption">{{ range.from === range.to ? t('data.map.captionOne', { date: f.date(range.to) }) : t('data.map.caption', { range: f.range(range.from, range.to) }) }}</p>

    <div v-for="b in blocks" :key="b.kind" class="mt-4 rounded-lg border bg-card p-4 shadow-card" :data-map-kind="b.kind">
      <h3 v-if="kinds.length > 1" class="mb-3 text-lg">{{ t(`data.map.${b.kind}`) }}</h3>
      <template v-if="b.rows.length">
        <p v-if="b.noActive" class="m-0 text-ink-muted" data-testid="map-no-active">{{ t('data.map.noActiveKab') }}</p>
        <ProvinceMap v-else-if="b.kind === 'provinces'" :items="b.items" :metric="metricProp" :mode="mode" :area-name="b.areaName" :date="b.date" :date-end="b.dateEnd" :pin="b.pin" :selected="b.selected" :href-for="hrefFor('provinces')" @select="select('provinces', $event)" />
        <KabupatenMap v-else :items="b.items" :metric="metricProp" :mode="mode" :area-name="b.areaName" :date="b.date" :date-end="b.dateEnd" :selected="b.selected" :href-for="hrefFor('kabupaten')" @select="select('kabupaten', $event)" />
      </template>
      <StatusView v-else-if="b.res.status.value === 'error'" kind="error" compact @retry="b.res.refresh" />
      <div v-else class="min-h-[18rem]"><StatusView kind="loading" compact /></div>
    </div>
  </section>
</template>

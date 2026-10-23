<script setup lang="ts">
import { computed, defineAsyncComponent, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useKabupatenLatest, useProvincesLatest } from '@/api/useSeries'
import { areaByCode } from '@/app/areas'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import SectionHeading from '@/components/SectionHeading.vue'
import StatusView from '@/components/StatusView.vue'
import { areaPath, DataPageKey } from '../useDataPage'
import { mapDate, mapKind, selectedCode, useSubAreaItems } from '../useSubAreaItems'
import type { MapMetricKey } from '../useSubAreaItems'

// Spec 44. The map shows the latest values (a small prerendered resource), not the date window, and says so.
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
const kind = mapKind(area)
const latest = kind === 'provinces' ? useProvincesLatest() : useKabupatenLatest()
const metric = ref<MapMetricKey>('positive')
const METRICS: MapMetricKey[] = ['positive', 'deceased', 'recovered']

const rows = computed(() => latest.data.value ?? [])
const items = computed(() => useSubAreaItems(rows.value, metric.value))
const date = computed(() => mapDate(rows.value))
const metricProp = computed(() => ({ label: t(`data.map.${metric.value}`), role: metric.value }))
const level = kind === 'provinces' ? 'provinsi' : 'kabupaten'

// choosing an area goes to its page and keeps the date window and the view (?dari, ?sampai, ?tampilan)
const hrefFor = (code: string): string => {
  const a = areaByCode(level, code)
  const qs = new URLSearchParams(Object.entries(route.query).flatMap(([k, v]) => (typeof v === 'string' ? [[k, v]] : []))).toString()
  return a ? `${localize(areaPath(a))}${qs ? `?${qs}` : ''}` : '#'
}
const select = (code: string) => void router.push(hrefFor(code))
</script>

<template>
  <section v-if="kind" aria-labelledby="peta" data-testid="submap">
    <SectionHeading id="peta" :level="2">{{ t('data.map.title') }}</SectionHeading>
    <fieldset class="m-0 mt-4 flex flex-wrap items-center gap-3 border-0 p-0">
      <legend class="mb-2 text-sm font-strong text-ink-muted">{{ t('data.map.metric') }}</legend>
      <label
        v-for="m in METRICS"
        :key="m"
        class="inline-flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded-sm border px-4 text-sm font-strong"
        :class="metric === m ? 'border-indigo bg-indigo text-on-indigo' : 'border-line-strong bg-surface text-ink'"
      >
        <input v-model="metric" type="radio" name="map-metric" class="sr-only" :value="m">
        {{ t(`data.map.${m}`) }}
      </label>
    </fieldset>
    <p v-if="date" class="mt-3 text-sm text-ink-muted" data-testid="map-caption">{{ t('data.map.caption', { date: f.date(date) }) }}</p>
    <div v-if="rows.length" class="mt-5">
      <ProvinceMap v-if="kind === 'provinces'" :items="items" :metric="metricProp" :href-for="hrefFor" @select="select" />
      <KabupatenMap v-else :items="items" :metric="metricProp" :selected="selectedCode(area)" :href-for="hrefFor" @select="select" />
    </div>
    <StatusView v-else-if="latest.status.value === 'error'" class="mt-5" kind="error" compact @retry="latest.refresh" />
    <div v-else class="mt-5 min-h-[18rem]"><StatusView kind="loading" compact /></div>
  </section>
</template>

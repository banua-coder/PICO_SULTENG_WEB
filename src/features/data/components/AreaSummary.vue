<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKabupatenLatest, useNationalLatest, useProvincesLatest } from '@/api/useSeries'
import type { LatestByArea } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import DataFreshness from '@/components/DataFreshness.vue'
import StatFigure from '@/components/StatFigure.vue'
import StatusView from '@/components/StatusView.vue'
import { rate, summaryRow } from '../summary'
import { DataPageKey } from '../useDataPage'

// Four figures for the last day of the window, and two rates. With the window ending on the latest day the numbers come from
// the small "latest" resources, which are in the prerendered HTML and in the page's initial state.
const state = inject(DataPageKey)!
const { t } = useI18n()
const fmt = useFormat()

const area = state.area.value // DataView keys the page by area, so it never changes under us
const latestList: { data: { value: LatestByArea | LatestByArea[] | undefined } } =
  area.level === 'indonesia' ? useNationalLatest() : area.level === 'provinsi' ? useProvincesLatest() : useKabupatenLatest()
const latest = computed(() => {
  const d = latestList.data.value
  return Array.isArray(d) ? d.find((x) => x.area.code === area.code) : d
})

const row = computed(() => summaryRow({ latest: latest.value, series: state.series.data.value, window: state.window.value, customEnd: state.customEnd.value }))
const waiting = computed(() => !row.value && state.series.status.value !== 'error')
const showActive = area.level !== 'kabupaten' // kabupaten rows carry no "active" (C2 invariant 4)
const pct = (n: number | null) => fmt.nullable(n, (v: number) => fmt.pct(v, 1))
</script>

<template>
  <div>
    <div v-if="row" data-testid="summary" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatFigure state="positive" :label="t('state.positive')" :value="row.cumulative.positive" :delta="row.daily.positive" :as-of="row.date" emphasis />
      <StatFigure state="recovered" :label="t('state.recovered')" :value="row.cumulative.recovered" :delta="row.daily.recovered" :as-of="row.date" />
      <StatFigure state="deceased" :label="t('state.deceased')" :value="row.cumulative.deceased" :delta="row.daily.deceased" :as-of="row.date" />
      <StatFigure v-if="showActive" state="active" :label="t('state.active')" :value="row.cumulative.active" :delta="row.daily.active" :as-of="row.date" />
    </div>
    <div v-else-if="waiting" class="min-h-[12rem]"><StatusView kind="loading" compact :title="t('data.loadingSummary')" /></div>
    <StatusView v-else kind="error" compact @retry="state.series.refresh" />

    <dl v-if="row" class="num mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
      <div class="flex justify-between gap-5"><dt class="text-ink-muted">{{ t('data.cfr') }}</dt><dd class="font-strong" data-testid="cfr">{{ pct(rate(row.cumulative.deceased, row.cumulative.positive)) }}</dd></div>
      <div class="flex justify-between gap-5"><dt class="text-ink-muted">{{ t('data.recoveryRate') }}</dt><dd class="font-strong" data-testid="recovery">{{ pct(rate(row.cumulative.recovered, row.cumulative.positive)) }}</dd></div>
    </dl>
    <DataFreshness v-if="row" class="mt-3" :as-of="row.date" :source="t('footer.thirdParty')" />
  </div>
</template>

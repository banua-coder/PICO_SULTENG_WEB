<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHomeLatest, useKabupatenLatest, useNationalLatest, useProvincesLatest } from '@/api/useSeries'
import type { LatestByArea } from '@/api/types'
import { SULTENG } from '@/app/areas'
import { useFormat } from '@/app/useFormat'
import DataFreshness from '@/components/DataFreshness.vue'
import StatFigure from '@/components/StatFigure.vue'
import StatusView from '@/components/StatusView.vue'
import { rate, summaryRow } from '../summary'
import { DataPageKey } from '../useDataPage'

// Four figures for the last day of the window (the last day with real counts unless the visitor moved it), and two rates.
// Before the series arrives, the numbers come from small resources that are in the prerendered HTML.
const state = inject(DataPageKey)!
const { t } = useI18n()
const fmt = useFormat()

const area = state.area.value // DataView keys the page by area, so it never changes under us
const latestList: { data: { value: LatestByArea | LatestByArea[] | undefined } } =
  area.level === 'indonesia' ? useNationalLatest() : area.level === 'provinsi' ? useProvincesLatest() : useKabupatenLatest()
const home = useHomeLatest()
const latest = computed(() => {
  const d = latestList.data.value
  return Array.isArray(d) ? d.find((x) => x.area.code === area.code) : d
})
const lastReal = computed(() => (area.level === 'indonesia' ? home.data.value?.lastReal.indonesia : area.level === 'provinsi' && area.code === SULTENG.code ? home.data.value?.lastReal['sulawesi-tengah'] : null))

const sel = computed(() => summaryRow({ latest: latest.value, series: state.series.data.value, window: state.window.value, lastReal: lastReal.value, customEnd: state.customEnd.value }))
const row = computed(() => sel.value?.row)
const d = <K extends 'positive' | 'recovered' | 'deceased' | 'active'>(k: K) => (sel.value?.dailyKnown ? row.value!.daily[k] : null)
const waiting = computed(() => !row.value && state.series.status.value !== 'error')
const showActive = area.level !== 'kabupaten' // kabupaten rows carry no "active" (C2 invariant 4)
const pct = (n: number | null) => fmt.nullable(n, (v: number) => fmt.pct(v, 1))
</script>

<template>
  <div>
    <div v-if="row" data-testid="summary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatFigure state="positive" :label="t('state.positive')" :value="row.cumulative.positive" :delta="d('positive')" :as-of="row.date" emphasis />
      <StatFigure v-if="showActive" state="active" :label="t('state.active')" :value="row.cumulative.active" :delta="d('active')" :as-of="row.date" />
      <StatFigure state="recovered" :label="t('state.recovered')" :value="row.cumulative.recovered" :delta="d('recovered')" :as-of="row.date" />
      <StatFigure state="deceased" :label="t('state.deceased')" :value="row.cumulative.deceased" :delta="d('deceased')" :as-of="row.date" />
    </div>
    <div v-else-if="waiting" class="min-h-[12rem]"><StatusView kind="loading" compact :title="t('data.loadingSummary')" /></div>
    <StatusView v-else kind="error" compact @retry="state.series.refresh" />

    <dl v-if="row" class="num mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
      <div class="flex justify-between gap-4"><dt class="text-ink-muted">{{ t('data.cfr') }}</dt><dd class="m-0 font-semibold" data-testid="cfr">{{ pct(rate(row.cumulative.deceased, row.cumulative.positive)) }}</dd></div>
      <div class="flex justify-between gap-4"><dt class="text-ink-muted">{{ t('data.recoveryRate') }}</dt><dd class="m-0 font-semibold" data-testid="recovery">{{ pct(rate(row.cumulative.recovered, row.cumulative.positive)) }}</dd></div>
    </dl>
    <DataFreshness v-if="row" class="mt-2" :as-of="row.date" :source="t('footer.thirdParty')" />
  </div>
</template>

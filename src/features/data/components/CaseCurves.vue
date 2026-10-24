<script setup lang="ts">
import { computed, defineAsyncComponent, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import Illustration from '@/components/Illustration.vue'
import OptionToggle from '@/components/OptionToggle.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StatusView from '@/components/StatusView.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { buildCurves } from '../useCaseCurves'
import { CASE_TYPES, DataPageKey, parseView } from '../useDataPage'
import type { CaseType } from '../useDataPage'

// Spec 42, in the old ChartTab shape: "Kasus harian" and "Kasus kumulatif" tabs, and one case type at a time (or all together).
// The chart code (d3) loads as its own chunk, after the shell, so the page's first paint does not wait for it.
const TimeSeriesChart = defineAsyncComponent(() => import('@/components/charts/TimeSeriesChart.vue'))
const state = inject(DataPageKey)!
const { t } = useI18n()
const f = useFormat()

const curves = computed(() => {
  const s = state.series.data.value
  if (!s) return null
  return buildCurves(s.rows, state.window.value, state.area.value.level, {
    positive: t('state.positive'),
    recovered: t('state.recovered'),
    deceased: t('state.deceased'),
    active: t('state.active'),
    average: t('data.curves.average'),
  })
})
const nf = (n: number) => f.num(n)
const hasActive = computed(() => state.area.value.level !== 'kabupaten') // a kabupaten has no "dirawat" (C2 invariant 4)
const type = computed<CaseType>(() => (state.caseType.value === 'active' && !hasActive.value ? 'positive' : state.caseType.value))
// Dirawat is the number of patients in care on a day, not a count of new cases: no bars, one cumulative line (both tabs)
const isActive = computed(() => type.value === 'active')
const single = computed(() => (type.value === 'all' || type.value === 'active' ? null : curves.value?.byType[type.value]))
const activeLine = computed(() => curves.value?.cumulative.find((s) => s.id === 'active'))
const typeLabel = (c: CaseType) => (c === 'all' ? t('data.curves.all') : t(`state.${c}`))
const typeOptions = computed(() => CASE_TYPES.filter((c) => c !== 'active' || hasActive.value).map((c) => ({ value: c, label: typeLabel(c) })))
const dailySummary = computed(() => {
  const c = curves.value
  const p = single.value
  if (!c?.last) return ''
  if (!p) return t('data.curves.summaryOthers', { date: f.date(c.last.date) })
  return p.peak
    ? t('data.curves.summaryDaily', { type: typeLabel(type.value).toLocaleLowerCase(), peak: nf(p.peak.value), peakDate: f.date(p.peak.date), last: nf(c.last.daily), lastDate: f.date(c.last.date) })
    : t('data.curves.summaryDailyNoPeak', { type: typeLabel(type.value).toLocaleLowerCase(), last: nf(c.last.daily), lastDate: f.date(c.last.date) })
})
const activeSummary = computed(() => {
  const r = curves.value?.rows.at(-1)
  return r ? t('data.curves.summaryActive', { value: nf(r.cumulative.active ?? 0), date: f.date(r.date) }) : ''
})
const cumulativeSummary = computed(() => (curves.value?.last ? t('data.curves.summaryCumulative', { value: nf(curves.value.last.cumulative), date: f.date(curves.value.last.date) }) : ''))
const range = computed<[string, string]>(() => [state.window.value.from, state.window.value.to])
const waiting = computed(() => !curves.value && state.series.status.value !== 'error')
const dailyTitle = computed(() => (single.value ? t('data.curves.dailyOf', { type: typeLabel(type.value).toLocaleLowerCase() }) : t('data.curves.dailyAll')))
</script>

<template>
  <section aria-labelledby="kurva" data-testid="curves">
    <SectionHeading id="kurva" :level="2">{{ t('data.curves.title') }}</SectionHeading>
    <Tabs class="mt-3" :model-value="state.view.value" @update:model-value="(v) => state.setView(parseView(v))">
      <TabsList class="grid w-full max-w-md grid-cols-2" :aria-label="t('data.curves.view')">
        <TabsTrigger value="harian">{{ t('data.curves.harian') }}</TabsTrigger>
        <TabsTrigger value="kumulatif">{{ t('data.curves.kumulatif') }}</TabsTrigger>
      </TabsList>
    </Tabs>
    <OptionToggle class="mt-4" :model-value="type" :options="typeOptions" :label="t('data.curves.type')" @update:model-value="state.setCaseType" />

    <p v-if="isActive && state.view.value === 'harian'" class="mt-2 text-sm text-ink-muted" data-testid="active-note">{{ t('data.curves.activeNote') }}</p>
    <div v-if="curves && curves.rows.length === 0" class="mt-4 flex flex-col items-center gap-2 text-ink-muted"><Illustration name="state-periode-kosong" :width="96" />{{ t('data.curves.noRows') }}</div>
    <Card v-else-if="curves" class="mt-4">
      <CardContent class="flex flex-col gap-8">
        <template v-if="state.view.value === 'harian'">
          <TimeSeriesChart
            v-if="single"
            kind="bar"
            :series="[single.daily]"
            :overlay="single.average"
            :peak="single.peak?.date"
            :range="range"
            :a11y="{ title: dailyTitle, summary: dailySummary }"
          />
          <TimeSeriesChart v-else-if="isActive && activeLine" kind="line" :series="[activeLine]" :range="range" :a11y="{ title: t('data.curves.activeTitle'), summary: activeSummary }" />
          <TimeSeriesChart v-else kind="line" :series="[curves.byType.positive.daily, ...curves.dailyLines]" :range="range" :a11y="{ title: dailyTitle, summary: dailySummary }" />
        </template>
        <TimeSeriesChart
          v-else
          kind="line"
          :series="single ? [single.cumulative] : isActive && activeLine ? [activeLine] : curves.cumulative"
          :range="range"
          :a11y="{ title: t('data.curves.cumulative'), summary: cumulativeSummary }"
        />
      </CardContent>
    </Card>
    <div v-else-if="waiting" class="mt-4 min-h-[18rem]"><StatusView kind="loading" compact /></div>
    <StatusView v-else class="mt-4" kind="error" compact @retry="state.series.refresh" />
  </section>
</template>

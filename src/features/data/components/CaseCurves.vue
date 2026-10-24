<script setup lang="ts">
import { computed, defineAsyncComponent, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import SectionHeading from '@/components/SectionHeading.vue'
import StatusView from '@/components/StatusView.vue'
import { buildCurves } from '../useCaseCurves'
import { DataPageKey } from '../useDataPage'
import type { DataView } from '../useDataPage'

// Spec 42. The chart code (d3) loads as its own chunk, after the shell, so the page's first paint does not wait for it.
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
const dailySummary = computed(() => {
  const c = curves.value
  if (!c?.last) return ''
  return c.peak
    ? t('data.curves.summaryDaily', { peak: nf(c.peak.value), peakDate: f.date(c.peak.date), last: nf(c.last.daily), lastDate: f.date(c.last.date) })
    : t('data.curves.summaryDailyNoPeak', { last: nf(c.last.daily), lastDate: f.date(c.last.date) })
})
const cumulativeSummary = computed(() => (curves.value?.last ? t('data.curves.summaryCumulative', { value: nf(curves.value.last.cumulative), date: f.date(curves.value.last.date) }) : ''))
const othersSummary = computed(() => (curves.value?.last ? t('data.curves.summaryOthers', { date: f.date(curves.value.last.date) }) : ''))
const range = computed<[string, string]>(() => [state.window.value.from, state.window.value.to])
const views: DataView[] = ['harian', 'kumulatif']
const waiting = computed(() => !curves.value && state.series.status.value !== 'error')
</script>

<template>
  <section aria-labelledby="kurva" data-testid="curves">
    <SectionHeading id="kurva" :level="2">{{ t('data.curves.title') }}</SectionHeading>
    <fieldset class="m-0 mt-4 flex flex-wrap items-center gap-3 border-0 p-0">
      <legend class="mb-2 text-sm font-strong text-ink-muted">{{ t('data.curves.view') }}</legend>
      <label
        v-for="v in views"
        :key="v"
        class="inline-flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded-sm border px-4 text-sm font-strong"
        :class="state.view.value === v ? 'border-indigo bg-indigo text-on-indigo' : 'border-line-strong bg-surface text-ink'"
      >
        <input type="radio" name="curves-view" class="sr-only" :value="v" :checked="state.view.value === v" @change="state.setView(v)">
        {{ t(`data.curves.${v}`) }}
      </label>
    </fieldset>

    <div v-if="curves && curves.rows.length === 0" class="mt-5 text-ink-muted">{{ t('data.curves.noRows') }}</div>
    <div v-else-if="curves" class="mt-5 flex flex-col gap-8">
      <template v-if="state.view.value === 'harian'">
        <TimeSeriesChart
          kind="bar"
          :series="[curves.dailyPositive]"
          :overlay="curves.average"
          :peak="curves.peak?.date"
          :range="range"
          :a11y="{ title: t('data.curves.dailyPositive'), summary: dailySummary }"
        />
        <TimeSeriesChart kind="line" :series="curves.dailyLines" :range="range" :a11y="{ title: t('data.curves.dailyOthers'), summary: othersSummary }" />
      </template>
      <TimeSeriesChart v-else kind="line" :series="curves.cumulative" :range="range" :a11y="{ title: t('data.curves.cumulative'), summary: cumulativeSummary }" />
    </div>
    <div v-else-if="waiting" class="mt-5 min-h-[18rem]"><StatusView kind="loading" compact /></div>
    <StatusView v-else class="mt-5" kind="error" compact @retry="state.series.refresh" />
  </section>
</template>

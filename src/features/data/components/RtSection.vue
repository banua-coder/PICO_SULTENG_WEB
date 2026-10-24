<script setup lang="ts">
import { computed, defineAsyncComponent, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import SectionHeading from '@/components/SectionHeading.vue'
import { Card, CardContent } from '@/components/ui/card'
import StatusView from '@/components/StatusView.vue'
import { FACTS } from '@/app/facts'
import { DataPageKey } from '../useDataPage'
import { lastRt, nullRuns, rtPoints } from '../useRtView'

// Spec 43. Honest about gaps: a day without Rt is a gap in the chart and is listed below it, with the reason.
const RtChart = defineAsyncComponent(() => import('@/components/charts/RtChart.vue'))
const state = inject(DataPageKey)!
const { t } = useI18n()
const f = useFormat()
const { localize } = useLocale()

const MAX_RUNS = 8
const rows = computed(() => state.series.data.value?.rows)
// Rt is estimated a few days after the last day with counts (Indonesia: 3 and 9 July 2023). With the window at its default end, the
// Rt view runs to its own last non-null day.
const lastRtDay = computed(() => [...(rows.value ?? [])].reverse().find((r) => r.rt)?.date)
const rtWindow = computed(() => {
  const w = state.window.value
  return !state.customEnd.value && lastRtDay.value && lastRtDay.value > w.to ? { from: w.from, to: lastRtDay.value } : w
})
const last = computed(() => (rows.value ? lastRt(rows.value, rtWindow.value) : null))
const points = computed(() => (rows.value ? rtPoints(rows.value, rtWindow.value) : []))
const recordEnd = computed(() => (rtWindow.value.to > state.bounds.value.to ? rtWindow.value.to : state.bounds.value.to))
const runs = computed(() => (rows.value ? nullRuns(rows.value, rtWindow.value, recordEnd.value) : []))
const shownRuns = computed(() => runs.value.slice(0, MAX_RUNS))
// the estimate stops at its last day: say so when the window is at its default end (a custom end may stop before it)
const showEnd = computed(() => !state.customEnd.value && !!last.value && last.value.date === lastRtDay.value)
const rt = (n: number) => f.num(n, 2)
const lastText = computed(() => (last.value ? t('data.rt.last', { value: rt(last.value.value), lo: rt(last.value.lower), hi: rt(last.value.upper), date: f.date(last.value.date) }) : ''))
const summary = computed(() => (last.value ? t('data.rt.summary', { value: rt(last.value.value), date: f.date(last.value.date) }) : t('data.rt.summaryNone')))
// the chart ends on the last day that has an Rt (never padded with zeros)
const range = computed<[string, string]>(() => [rtWindow.value.from, last.value?.date ?? rtWindow.value.to])
const waiting = computed(() => !rows.value && state.series.status.value !== 'error')
</script>

<template>
  <section aria-labelledby="rt" data-testid="rt-section">
    <SectionHeading id="rt" :level="2">{{ t('data.rt.title') }}</SectionHeading>
    <p class="mt-2 max-w-prose">{{ t('data.rt.explain') }} {{ t('data.rt.explain2') }} <RouterLink :to="localize('/metodologi') + '#rt'">{{ t('data.rt.method') }}</RouterLink>.</p>

    <template v-if="rows">
      <p v-if="last" class="num mt-3 text-lg font-strong" data-testid="rt-last">{{ lastText }}</p>
      <p v-else class="mt-3 font-strong" data-testid="rt-none">{{ t('data.rt.none') }}</p>
      <Card v-if="last" class="mt-3"><CardContent><RtChart :points="points" :range="range" :a11y="{ title: t('data.rt.chartTitle'), summary }" /></CardContent></Card>

      <p v-if="showEnd && !runs.length" class="mt-2 text-sm text-ink-muted" data-testid="rt-end">{{ t('data.rt.gapEnd', { date: f.date(last!.date) }) }}</p>
      <div v-if="runs.length" class="mt-3 text-sm" data-testid="rt-gaps">
        <p class="m-0 font-strong">{{ t('data.rt.gaps') }}</p>
        <ul class="m-0 mt-1 list-disc pl-4">
          <li v-for="r in shownRuns" :key="r.from" class="num">{{ f.range(r.from, r.to) }}</li>
          <li v-if="runs.length > MAX_RUNS">{{ t('data.rt.gapMore', { n: runs.length - MAX_RUNS }) }}</li>
        </ul>
        <p class="mt-2 text-ink-muted">{{ t('data.rt.gapReason', { n: FACTS.minCases }) }}</p>
        <p v-if="showEnd" class="mt-1 text-ink-muted" data-testid="rt-end">{{ t('data.rt.gapEnd', { date: f.date(last!.date) }) }}</p>
      </div>
    </template>
    <div v-else-if="waiting" class="mt-4 min-h-[18rem]"><StatusView kind="loading" compact /></div>
    <StatusView v-else class="mt-4" kind="error" compact @retry="state.series.refresh" />
  </section>
</template>

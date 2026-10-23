<script setup lang="ts">
import { computed, defineAsyncComponent, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import SectionHeading from '@/components/SectionHeading.vue'
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
const last = computed(() => (rows.value ? lastRt(rows.value, state.window.value) : null))
const points = computed(() => (rows.value ? rtPoints(rows.value, state.window.value) : []))
const runs = computed(() => (rows.value ? nullRuns(rows.value, state.window.value) : []))
const shownRuns = computed(() => runs.value.slice(0, MAX_RUNS))
const endRun = computed(() => runs.value.find((r) => r.kind === 'end'))
const rt = (n: number) => f.num(n, 2)
const lastText = computed(() => (last.value ? t('data.rt.last', { value: rt(last.value.value), lo: rt(last.value.lower), hi: rt(last.value.upper), date: f.date(last.value.date) }) : ''))
const summary = computed(() => (last.value ? t('data.rt.summary', { value: rt(last.value.value), date: f.date(last.value.date) }) : t('data.rt.summaryNone')))
const range = computed<[string, string]>(() => [state.window.value.from, state.window.value.to])
const waiting = computed(() => !rows.value && state.series.status.value !== 'error')
</script>

<template>
  <section aria-labelledby="rt" data-testid="rt-section">
    <SectionHeading id="rt" :level="2">{{ t('data.rt.title') }}</SectionHeading>
    <p class="mt-3 max-w-prose">{{ t('data.rt.explain') }} {{ t('data.rt.explain2') }} <RouterLink :to="localize('/metodologi') + '#rt'">{{ t('data.rt.method') }}</RouterLink>.</p>

    <template v-if="rows">
      <p v-if="last" class="num mt-4 text-lg font-strong" data-testid="rt-last">{{ lastText }}</p>
      <p v-else class="mt-4 font-strong" data-testid="rt-none">{{ t('data.rt.none') }}</p>
      <RtChart v-if="last" class="mt-4" :points="points" :range="range" :a11y="{ title: t('data.rt.chartTitle'), summary }" />

      <div v-if="runs.length" class="mt-4 text-sm" data-testid="rt-gaps">
        <p class="m-0 font-strong">{{ t('data.rt.gaps') }}</p>
        <ul class="m-0 mt-2 list-disc pl-5">
          <li v-for="r in shownRuns" :key="r.from" class="num">{{ f.range(r.from, r.to) }}</li>
          <li v-if="runs.length > MAX_RUNS">{{ t('data.rt.gapMore', { n: runs.length - MAX_RUNS }) }}</li>
        </ul>
        <p class="mt-3 text-ink-muted">{{ t('data.rt.gapReason', { n: FACTS.minCases }) }}</p>
        <p v-if="endRun" class="mt-2 text-ink-muted" data-testid="rt-end">{{ t('data.rt.gapEnd', { date: f.date(last?.date ?? endRun.from) }) }}</p>
      </div>
    </template>
    <div v-else-if="waiting" class="mt-5 min-h-[18rem]"><StatusView kind="loading" compact /></div>
    <StatusView v-else class="mt-5" kind="error" compact @retry="state.series.refresh" />
  </section>
</template>

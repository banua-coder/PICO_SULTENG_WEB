<script setup lang="ts">
import { computed, defineAsyncComponent, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import OptionToggle from '@/components/OptionToggle.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StatusView from '@/components/StatusView.vue'
import { DataPageKey } from '../useDataPage'
import { newCaseBars, shareBars, useKabupatenNewCases } from '../useRegencyNewCases'
import { lastRealRow } from '@/app/homeLatest'

// The legacy "Perubahan Data di Kabupaten/Kota" bar chart (NewCase.vue) next to its pie (PieChart.vue), in the app's category colours.
// The pie becomes labelled bars with the same numbers (three slices that must be compared are easier to read as bars, and every bar
// carries its count and share as text). New cases are the last reporting day of the 13 kabupaten/kota, cut at build time.
const BarList = defineAsyncComponent(() => import('@/components/charts/BarList.vue'))
const state = inject(DataPageKey)!
const { t } = useI18n()
const f = useFormat()
const area = state.area.value
const showRegencies = area.level === 'kabupaten' || area.code === '72'
const nc = useKabupatenNewCases()
const type = ref<'positive' | 'recovered' | 'deceased'>('positive')
const TYPES = ['positive', 'recovered', 'deceased'] as const
const nf = (n: number | null) => f.nullable(n, (v: number) => f.num(v))

const day = computed(() => nc.data.value ?? null)
const bars = computed(() => (day.value ? newCaseBars(day.value.items, type.value) : []))
const typeLabel = computed(() => t(`state.${type.value}`).toLocaleLowerCase())
const summary = computed(() => {
  const top = bars.value[0]
  return day.value && top?.value ? t('data.newCases.summary', { top: top.label, value: nf(top.value), date: f.date(day.value.date) }) : ''
})

const row = computed(() => {
  const rows = state.series.data.value?.rows
  return rows ? lastRealRow(rows) : undefined
})
const share = computed(() => (row.value ? shareBars(row.value, { active: t('state.active'), recovered: t('state.recovered'), deceased: t('state.deceased') }, (n) => f.pct(n, 1), (n) => f.num(n)) : []))
const shareSummary = computed(() => t('data.composition.summary', { values: share.value.map((b) => b.label).join(', ') }))
const noActive = computed(() => !!row.value && row.value.cumulative.active === null)
</script>

<template>
  <section v-if="showRegencies || row" aria-labelledby="kasus-baru" data-testid="new-cases">
    <template v-if="showRegencies">
      <SectionHeading id="kasus-baru" :level="2">{{ t('data.newCases.title') }}</SectionHeading>
      <template v-if="day">
        <p class="mt-2 text-sm text-ink-muted" data-testid="new-cases-caption">{{ t('data.newCases.caption', { date: f.date(day.date) }) }}</p>
        <OptionToggle v-model="type" class="mt-3" :options="TYPES.map((k) => ({ value: k, label: t(`state.${k}`) }))" :label="t('data.newCases.type')" />
        <div class="mt-4 rounded-lg border bg-card p-4 shadow-card" data-testid="new-cases-chart">
          <BarList :items="bars" orientation="horizontal" :a11y="{ title: t('data.newCases.chart', { type: typeLabel, date: f.date(day.date) }), summary }" />
        </div>
      </template>
      <StatusView v-else-if="nc.status.value === 'error'" class="mt-4" kind="error" compact @retry="nc.refresh" />
      <div v-else class="mt-4 min-h-[12rem]"><StatusView kind="loading" compact /></div>
    </template>

    <div v-if="row" :class="showRegencies ? 'mt-8' : ''" data-testid="case-share">
      <component :is="showRegencies ? 'h3' : 'h2'" :id="showRegencies ? undefined : 'kasus-baru'" class="m-0 font-display text-lg font-heading text-ink">{{ t('data.composition.title') }}</component>
      <p class="mt-2 text-sm text-ink-muted">{{ t('data.composition.caption', { date: f.date(row.date) }) }}</p>
      <p v-if="noActive" class="mt-1 text-sm text-ink-muted">{{ t('data.composition.noActive') }}</p>
      <div class="mt-3 rounded-lg border bg-card p-4 shadow-card">
        <BarList :items="share" orientation="horizontal" :max="Math.max(0, ...share.map((b) => b.value ?? 0))" :a11y="{ title: t('data.composition.chart', { area: area.name, date: f.date(row.date) }), summary: shareSummary }" />
      </div>
    </div>
  </section>
</template>

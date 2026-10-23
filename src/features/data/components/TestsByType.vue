<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTests } from '@/api/useStats'
import { FACTS } from '@/app/facts'
import { useFormat } from '@/app/useFormat'
import SectionHeading from '@/components/SectionHeading.vue'
import StatusView from '@/components/StatusView.vue'
import { typeInfo, useTestSeries } from '../useGenderTests'

// Spec 45, Sulawesi Tengah only. PCR and RDT are the only types with rows. The data ends on 28 September 2020 and says so.
const TimeSeriesChart = defineAsyncComponent(() => import('@/components/charts/TimeSeriesChart.vue'))
const { t } = useI18n()
const f = useFormat()
const tests = useTests()
const TYPES = ['pcr', 'rdt'] as const

const blocks = computed(() => {
  const d = tests.data.value
  if (!d) return []
  return TYPES.flatMap((type) => {
    const s = useTestSeries(d.periods, type, { positive: t('data.tests.positive'), negative: t('data.tests.negative') })
    if (!s.last || !s.first) return []
    const info = typeInfo(d.types, type)
    const name = info ? `${type.toUpperCase()} (${info.name})` : type.toUpperCase()
    return [{ type, name, info, ...s, summary: t('data.tests.summary', { type: type.toUpperCase(), first: f.date(s.first.from), last: f.date(s.last.from), positive: f.num(s.last.positive), negative: f.num(s.last.negative) }) }]
  })
})
const n = (v: number) => f.num(v)
</script>

<template>
  <section aria-labelledby="tes" data-testid="tests">
    <SectionHeading id="tes" :level="2">{{ t('data.tests.title') }}</SectionHeading>
    <p class="mt-3 text-sm text-ink-muted" data-testid="tests-note">{{ t('data.tests.note', { date: f.date(FACTS.testsEnd) }) }}</p>
    <div v-if="tests.data.value" class="mt-5 grid gap-8 lg:grid-cols-2">
      <div v-for="b in blocks" :key="b.type" :data-type="b.type">
        <TimeSeriesChart kind="line" :series="b.series" :a11y="{ title: t('data.tests.chart', { type: b.name }), summary: b.summary }" />
        <h3 class="mt-4 text-md">{{ t('data.tests.last', { date: f.date(b.last!.from) }) }}</h3>
        <dl class="num mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-sm">
          <dt class="text-ink-muted">{{ t('data.tests.processed') }}</dt><dd class="m-0">{{ n(b.last!.process) }}</dd>
          <dt class="text-ink-muted">{{ t('data.tests.invalid') }}</dt><dd class="m-0">{{ n(b.last!.invalid) }}</dd>
          <dt class="text-ink-muted">{{ t('data.tests.positive') }}</dt><dd class="m-0">{{ n(b.last!.positive) }}</dd>
          <dt class="text-ink-muted">{{ t('data.tests.negative') }}</dt><dd class="m-0">{{ n(b.last!.negative) }}</dd>
        </dl>
        <p v-if="b.info" class="mt-3 text-sm text-ink-muted">{{ t('data.tests.sample') }}: {{ b.info.sample }}. {{ t('data.tests.duration') }}: {{ b.info.duration }}.</p>
      </div>
    </div>
    <StatusView v-else-if="tests.status.value === 'error'" class="mt-5" kind="error" compact @retry="tests.refresh" />
    <div v-else class="mt-5 min-h-[12rem]"><StatusView kind="loading" compact /></div>
  </section>
</template>

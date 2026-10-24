<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VaccinationDay } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import SectionHeading from '@/components/SectionHeading.vue'
import { doseSeries } from '../useVaksin'

const TimeSeriesChart = defineAsyncComponent(() => import('@/components/charts/TimeSeriesChart.vue'))
const props = defineProps<{ days: VaccinationDay[] }>()
const { t } = useI18n()
const f = useFormat()
const series = computed(() => doseSeries(props.days, { dose1: t('vaksin.dose1'), dose2: t('vaksin.dose2') }))
const summary = computed(() => {
  const d = props.days.at(-1)
  return d ? t('vaksin.overSummary', { date: f.date(d.date), d1: f.num(d.total.cumulative.dose1), d2: f.num(d.total.cumulative.dose2) }) : ''
})
</script>

<template>
  <section aria-labelledby="dosis" data-testid="doses-over-time">
    <SectionHeading id="dosis" :level="2">{{ t('vaksin.overTitle') }}</SectionHeading>
    <TimeSeriesChart class="mt-4" kind="line" :series="series" :a11y="{ title: t('vaksin.overChart'), summary }" />
  </section>
</template>

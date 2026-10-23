<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { VaccinationDay } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import SectionHeading from '@/components/SectionHeading.vue'
import ProgressWeave from '@/components/charts/ProgressWeave.vue'

// The last day of the series: dose 1 and dose 2 against the total target, and the date the data stops.
defineProps<{ day: VaccinationDay }>()
const { t } = useI18n()
const f = useFormat()
</script>

<template>
  <section aria-labelledby="capaian" data-testid="coverage-now">
    <SectionHeading id="capaian" :level="2">{{ t('vaksin.nowTitle') }}</SectionHeading>
    <p class="mt-3 text-ink-muted" data-testid="vaccine-asof">{{ t('vaksin.nowText', { date: f.date(day.date) }) }}</p>
    <div class="mt-5 grid max-w-3xl gap-6">
      <ProgressWeave :value="day.total.cumulative.dose1" :target="day.target" :label="t('vaksin.dose1')" role="positive" :digits="2" />
      <ProgressWeave :value="day.total.cumulative.dose2" :target="day.target" :label="t('vaksin.dose2')" role="positive" :digits="2" />
    </div>
    <p class="num mt-3 text-sm text-ink-muted">{{ t('vaksin.target', { target: f.num(day.target) }) }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VaccinationDay, VaccinationGroupKey } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import SectionHeading from '@/components/SectionHeading.vue'
import VaccineCard from '@/components/vaccine/VaccineCard.vue'
import VaccineTargetCard from '@/components/vaccine/VaccineTargetCard.vue'

// "Situasi Vaksinasi COVID-19" of the old Vaccine page: the target tiles (total, then the five groups) and the two dose cards.
const props = defineProps<{ day: VaccinationDay }>()
const { t } = useI18n()
const f = useFormat()
const ORDER: VaccinationGroupKey[] = ['elderly', 'public_officer', 'health_worker', 'public', 'teenager']
const targets = computed(() => ORDER.flatMap((key) => {
  const g = props.day.groups.find((x) => x.key === key)
  return g ? [{ key: key as string, target: g.target, label: t(`vaksin.card.targets.${key}`) }] : []
}))
</script>

<template>
  <section aria-labelledby="situasi-vaksin" data-testid="vaccine-cards">
    <SectionHeading id="situasi-vaksin" :level="2">{{ t('vaksin.cardsTitle') }}</SectionHeading>
    <p class="mt-2 text-ink-muted"><span>{{ t('vaksin.card.updated') }}:</span> <time :datetime="day.date" class="text-ink">{{ f.date(day.date) }}</time> · {{ t('vaksin.nowText', { date: f.date(day.date) }) }}</p>
    <div class="my-6 grid grid-cols-1 gap-5 lg:grid-cols-2" data-testid="vaccine-targets">
      <VaccineTargetCard :target="day.target" :label="t('vaksin.card.targetTotal')" group="total" />
      <VaccineTargetCard v-for="g in targets" :key="g.key" :target="g.target" :label="g.label" :group="g.key" />
    </div>
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <VaccineCard :day="day" dose="dose1" :title="t('vaksin.card.dose1')" />
      <VaccineCard :day="day" dose="dose2" :title="t('vaksin.card.dose2')" />
    </div>
  </section>
</template>

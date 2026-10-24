<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VaccinationDay, VaccinationGroupKey } from '@/api/types'
import SectionHeading from '@/components/SectionHeading.vue'
import VaccineProgressCard from '@/components/vaccine/VaccineProgressCard.vue'

// "Progress Vaksinasi COVID-19" of the old Vaccine page (legacy VaccineProgress.vue): two columns, Dosis 1 and Dosis 2, each with six cards:
// Semua, Lansia, Petugas Publik, Tenaga Kesehatan, Masyarakat Umum dan Rentan, Usia 12 - 17, every one in its own colour.
const props = defineProps<{ day: VaccinationDay }>()
const { t } = useI18n()
const ORDER: VaccinationGroupKey[] = ['elderly', 'public_officer', 'health_worker', 'public', 'teenager']
const columns = computed(() =>
  (['dose1', 'dose2'] as const).map((dose) => ({
    dose,
    title: t(`vaksin.card.${dose}`),
    cards: [
      { group: 'total', title: t('vaksin.progress.all'), total: props.day.total.cumulative[dose], target: props.day.target, addition: props.day.total.daily[dose], previous: props.day.previousDaily?.[dose] },
      ...ORDER.flatMap((key) => {
        const g = props.day.groups.find((x) => x.key === key)
        return g ? [{ group: key as string, title: t(`vaksin.progress.${key}`), total: g.cumulative[dose], target: g.target, addition: g.daily[dose], previous: g.previousDaily?.[dose] }] : []
      }),
    ],
  })),
)
</script>

<template>
  <section aria-labelledby="progress-vaksin" data-testid="vaccine-progress">
    <SectionHeading id="progress-vaksin" :level="2">{{ t('vaksin.progress.title') }}</SectionHeading>
    <div class="mt-4 grid w-full gap-5 xl:grid-cols-2">
      <div v-for="c in columns" :key="c.dose" class="grid w-full grid-cols-1 content-start gap-5" :data-dose="c.dose">
        <h3 class="m-0 text-[1.5rem] font-semibold">{{ c.title }}</h3>
        <VaccineProgressCard v-for="card in c.cards" :key="card.group" v-bind="card" />
      </div>
    </div>
  </section>
</template>

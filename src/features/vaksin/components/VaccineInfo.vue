<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SectionHeading from '@/components/SectionHeading.vue'

// "Informasi Vaksinasi COVID-19" of the old Vaccine page (legacy Pages/Vaccine/Index.vue): Rangkuman, Apa itu vaksinasi, obat, herd immunity,
// efek samping, KIPI. The Indonesian text is the legacy text (typos fixed); the source of each answer is the Kemenkes site, as there.
const { t } = useI18n()
const items = [0, 1, 2, 3, 4] // Rangkuman, Apa itu vaksinasi, obat, herd immunity, efek samping
</script>

<template>
  <section aria-labelledby="info-vaksin" class="rounded-lg bg-card p-6 text-card-foreground shadow-lg md:p-8" data-testid="vaccine-info">
    <SectionHeading id="info-vaksin" :level="2">{{ t('vaksin.info.title') }}</SectionHeading>
    <div v-for="i in items" :key="i" class="mt-6">
      <h3 class="m-0 mb-2 text-lg font-semibold">{{ t(`vaksin.info.items[${i}].q`) }}</h3>
      <p class="m-0 max-w-prose">{{ t(`vaksin.info.items[${i}].a`) }}</p>
      <p class="m-0 mt-1 text-xs italic text-ink-muted">{{ t('vaksin.info.source') }}: <a href="https://kesmas.kemkes.go.id" rel="noopener noreferrer" target="_blank">kesmas.kemkes.go.id</a></p>
    </div>
    <div class="mt-6">
      <h3 class="m-0 mb-2 text-lg font-semibold">{{ t('vaksin.info.kipiQ') }}</h3>
      <p class="m-0 max-w-prose">{{ t('vaksin.info.kipiA') }} <a href="https://kipi.covid19.go.id" rel="noopener noreferrer" target="_blank">kipi.covid19.go.id</a></p>
    </div>
  </section>
</template>

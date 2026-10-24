<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IsoDate, Observation } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import SuspectCard from './SuspectCard.vue'

// PDP then ODP side by side (the legacy order) with the honest note that the source stopped.
defineProps<{ date: IsoDate; odp: Observation | null; pdp: Observation | null }>()
const { t } = useI18n()
const f = useFormat()
</script>

<template>
  <div data-testid="suspect-cards">
    <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
      <SuspectCard kind="pdp" :observation="pdp" :as-of="date" />
      <SuspectCard kind="odp" :observation="odp" :as-of="date" />
    </div>
    <p class="m-0 mt-2 text-sm text-ink-muted">{{ t('suspect.note', { date: f.date(date) }) }}</p>
  </div>
</template>

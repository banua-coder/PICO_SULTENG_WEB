<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHeading from '@/components/SectionHeading.vue'
import SuspectCards from '@/components/SuspectCards.vue'
import { lastObservationRow } from '../summary'
import { DataPageKey } from '../useDataPage'

// Province and kabupaten only (not Indonesia). The legacy PDP and ODP cards with the last real figures and their date: the source stopped
// reporting them, so later days are null (C1 Q5) and the note says so.
const state = inject(DataPageKey)!
const { t } = useI18n()

const applies = state.area.value.level !== 'indonesia'
const last = computed(() => (applies && state.series.data.value ? lastObservationRow(state.series.data.value.rows) : undefined))
</script>

<template>
  <section v-if="last" aria-labelledby="odp-pdp" data-testid="odp-note">
    <SectionHeading id="odp-pdp" :level="2">{{ t('data.odpTitle') }}</SectionHeading>
    <SuspectCards class="mt-3 block" :date="last.date" :odp="last.odp" :pdp="last.pdp" />
  </section>
</template>

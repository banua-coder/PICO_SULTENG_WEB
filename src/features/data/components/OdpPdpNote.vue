<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import SectionHeading from '@/components/SectionHeading.vue'
import { lastObservationRow } from '../summary'
import { DataPageKey } from '../useDataPage'

// Province and kabupaten only. The source stopped reporting ODP/PDP, so later days are null (C1 Q5): say so, with the date.
const state = inject(DataPageKey)!
const { t } = useI18n()
const fmt = useFormat()

const applies = state.area.value.level !== 'indonesia'
const last = computed(() => (applies && state.series.data.value ? lastObservationRow(state.series.data.value.rows) : undefined))
const line = (kind: string, o: { total: number | null; finished: number | null } | null) =>
  o ? t('data.odpLine', { kind, total: fmt.nullable(o.total, (n: number) => fmt.num(n)), finished: fmt.nullable(o.finished, (n: number) => fmt.num(n)) }) : null
</script>

<template>
  <section v-if="last" aria-labelledby="odp-pdp" data-testid="odp-note">
    <SectionHeading id="odp-pdp" :level="2">{{ t('data.odpTitle') }}</SectionHeading>
    <ul class="num m-0 mt-3 list-none p-0">
      <li v-if="line(t('data.odpOdp'), last.odp)">{{ line(t('data.odpOdp'), last.odp) }}</li>
      <li v-if="line(t('data.odpPdp'), last.pdp)">{{ line(t('data.odpPdp'), last.pdp) }}</li>
    </ul>
    <p class="mt-3 text-ink-muted">{{ t('data.odpAsOf', { date: fmt.date(last.date) }) }} {{ t('data.odpNote', { date: fmt.date(last.date) }) }}</p>
  </section>
</template>

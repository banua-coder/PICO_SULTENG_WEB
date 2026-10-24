<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IsoDate, Observation } from '@/api/types'
import { useFormat } from '@/app/useFormat'

// The owner's CardSuspect (legacy `components/CardSuspect.vue`), ported: a white card with a gray title rule, "Dalam Pengawasan/Pemantauan"
// and "Selesai ..." side by side (figure and its share of the total), and the total under them. The source stopped reporting ODP and PDP, so
// the figures are the last real day, with its date and a note. A missing number says so, a share is shown only when the total is above 0
// (the legacy card printed NaN%).
const props = defineProps<{ kind: 'pdp' | 'odp'; observation: Observation | null; asOf: IsoDate }>()
const { t } = useI18n()
const f = useFormat()
const n = (v: number | null) => f.nullable(v, (x: number) => f.num(x))
const share = (v: number | null) => (v !== null && props.observation?.total ? f.pct((v / props.observation.total) * 100, 2) : null)
const o = computed(() => props.observation)
</script>

<template>
  <div class="flex w-full flex-col rounded-lg bg-card shadow-lg" :data-kind="kind" data-testid="suspect-card">
    <h4 class="m-0 rounded-t-lg border-b-2 border-line-strong p-2 text-center text-sm font-bold uppercase text-ink-muted md:text-[1.125rem]">{{ t(`suspect.${kind}.title`) }}</h4>
    <div v-if="o" class="num text-center">
      <div class="mt-4 flex items-start">
        <div class="w-1/2 px-1">
          <p class="m-0 text-xs md:text-base">{{ t('suspect.inStatus', { status: t(`suspect.${kind}.status`) }) }}</p>
          <p class="m-0 text-[1.875rem] font-bold leading-tight" data-active>{{ n(o.active) }}</p>
          <p class="m-0 mt-1 text-sm text-ink-muted" data-active-share>{{ share(o.active) ?? '' }}</p>
        </div>
        <div class="w-1/2 px-1">
          <p class="m-0 text-xs md:text-base">{{ t('suspect.finished', { status: t(`suspect.${kind}.status`) }) }}</p>
          <p class="m-0 text-[1.875rem] font-bold leading-tight" data-finished>{{ n(o.finished) }}</p>
          <p class="m-0 mt-1 text-sm text-ink-muted" data-finished-share>{{ share(o.finished) ?? '' }}</p>
        </div>
      </div>
      <div class="mb-2 mt-3">
        <p class="m-0">{{ t('suspect.total') }}</p>
        <p class="m-0 text-[1.875rem] font-bold leading-tight" data-total>{{ n(o.total) }}</p>
      </div>
    </div>
    <p v-else class="m-0 p-4 text-center text-ink-muted" data-none>{{ t('format.notAvailable') }}</p>
    <p class="m-0 border-t px-3 py-2 text-center text-xs text-ink-muted">{{ t('suspect.asOf', { date: f.date(asOf) }) }}</p>
  </div>
</template>

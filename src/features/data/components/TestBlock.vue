<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'

// The owner's PCR and RDT blocks (legacy DataPCR.vue / DataRDT.vue): a coloured panel with white text, the explanation and the date of the
// last update on the left, the total and the four results with their share on the right. The panel uses a darker step of the legacy
// green and blue so the white text passes AA; the exact legacy hex is the left rule. A share that cannot be computed says so, never NaN.
defineProps<{
  type: 'pcr' | 'rdt'
  name: string
  description: string
  updated: IsoDate
  totals: { total: number; positive: number; negative: number; invalid: number; process: number; share: Record<'positive' | 'negative' | 'invalid' | 'process', number | null> }
}>()
const { t } = useI18n()
const f = useFormat()
const FIGURES = ['positive', 'negative', 'invalid', 'process'] as const
const label = (k: (typeof FIGURES)[number]) => t(k === 'process' ? 'data.tests.processed' : `data.tests.${k}`)
</script>

<template>
  <div
    class="overflow-hidden rounded-lg border-l-8 p-5 shadow-lg"
    :style="{ backgroundColor: `var(--pico-test-${type}-ground)`, borderLeftColor: `var(--pico-test-${type})`, color: 'var(--pico-on-test)' }"
    :data-block="type"
    :aria-label="t('data.tests.blockFigures', { type: type.toUpperCase() })"
    role="group"
  >
    <h3 class="m-0 text-[1.125rem] [color:inherit]">{{ name }}</h3>
    <div class="mt-2 flex flex-col gap-4 md:flex-row">
      <div class="text-sm md:w-1/2">
        <p class="m-0">{{ description }}</p>
        <p class="mb-0 mt-3 font-bold">{{ t('data.tests.updated') }}: <time :datetime="updated">{{ f.date(updated) }}</time></p>
      </div>
      <div class="md:w-1/2">
        <p class="num m-0 text-[2.25rem] font-bold leading-none" data-total>{{ f.num(totals.total) }}</p>
        <p class="m-0 mt-1 text-sm" :title="t('data.tests.totalHint')">{{ t('data.tests.total', { type: type.toUpperCase() }) }}</p>
        <dl class="num mb-0 mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div v-for="k in FIGURES" :key="k" :data-figure="k" class="flex flex-col">
            <dd class="m-0 text-[1.25rem] font-bold leading-none">{{ f.num(totals[k]) }}</dd>
            <dd class="m-0 text-sm">{{ totals.share[k] === null ? t('format.notAvailable') : `(${f.pct(totals.share[k]!, 2)})` }}</dd>
            <dt class="order-last mt-1">{{ label(k) }}</dt>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

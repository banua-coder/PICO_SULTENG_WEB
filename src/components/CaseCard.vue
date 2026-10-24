<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronsDown, ChevronsUp } from '@lucide/vue'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import type { DataState } from './StateMark.vue'

// The owner's CardCase (legacy Vue 2 `components/CardCase.vue`), ported: a white rounded card with a big shadow, the category name in
// capitals in the category colour, two halves side by side (area name, cumulative figure, a round coloured chip with a double chevron and
// the day's change). Same markup shape and type sizes (text-2xl title and figure, text-sm area name). Additions: each half carries its own
// date (a half can be older than the other), the chevron has a text alternative, and a missing number says so instead of showing 0.
export type CaseColumn = { title: string; value: number | null; delta: number | null; asOf: IsoDate }
const props = defineProps<{ state: DataState; label: string; columns: CaseColumn[] }>()
const { t } = useI18n()
const fmt = useFormat()
const cols = computed(() => props.columns)
// legacy: icon(value) is the up chevron for >= 0 and the down chevron below 0
const down = (n: number) => n < 0
const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '')
</script>

<template>
  <div class="w-full rounded-lg bg-card p-4 shadow-lg" :data-state="state" :style="{ color: `var(--pico-${state}-ink)` }">
    <h4 class="m-0 text-center [color:inherit] text-[1.5rem] leading-8 font-bold uppercase">{{ label }}</h4>
    <div class="mt-3 flex flex-row text-center font-bold">
      <div v-for="c in cols" :key="c.title" class="min-w-0 flex-1 px-1" data-column>
        <b class="text-sm font-semibold text-ink">{{ c.title }}</b>
        <div class="num text-[1.5rem] leading-8" data-figure>{{ fmt.nullable(c.value, (n: number) => fmt.num(n)) }}</div>
        <div class="num" data-delta>
          <template v-if="c.delta !== null">
            <span class="mr-1 inline-flex items-center rounded-full px-2 py-0.5 align-middle" :style="{ backgroundColor: `var(--pico-${state})` }" aria-hidden="true">
              <component :is="down(c.delta) ? ChevronsDown : ChevronsUp" class="size-3 text-white" />
            </span>
            <span class="sr-only">{{ t('beranda.daily') }}:</span>{{ sign(c.delta) }}{{ fmt.num(Math.abs(c.delta)) }}
          </template>
          <template v-else>{{ t('stat.deltaNone') }}</template>
        </div>
        <div class="text-xs font-normal text-ink-muted"><time :datetime="c.asOf">{{ fmt.date(c.asOf) }}</time></div>
      </div>
    </div>
  </div>
</template>

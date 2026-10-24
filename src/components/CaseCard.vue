<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronsDown, ChevronsUp } from '@lucide/vue'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { Card } from '@/components/ui/card'
import StateMark from './StateMark.vue'
import type { DataState } from './StateMark.vue'

// The old PICO case card: the role name on top, then Sulawesi Tengah and Indonesia side by side, each with its total and its change.
export type CaseColumn = { title: string; value: number | null; delta: number | null; asOf: IsoDate }
const props = defineProps<{ state: DataState; label: string; columns: CaseColumn[] }>()
const { t } = useI18n()
const fmt = useFormat()
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt.num(Math.abs(n))}`
const RULE: Record<DataState, string> = { positive: 'border-t-positive', recovered: 'border-t-recovered', deceased: 'border-t-deceased', active: 'border-t-active', rt: 'border-t-rt' }
const cols = computed(() => props.columns)
</script>

<template>
  <Card class="gap-3 border-t-4 py-4" :class="RULE[state]" :data-state="state">
    <h4 class="m-0 flex items-center gap-2 px-4 text-xl uppercase" :style="{ color: `var(--pico-${state})` }">
      <StateMark :state="state" :size="3" /><span>{{ label }}</span>
    </h4>
    <div class="grid grid-cols-2 gap-3 px-4">
      <div v-for="c in cols" :key="c.title" class="min-w-0">
        <p class="m-0 text-sm font-semibold text-ink-muted">{{ c.title }}</p>
        <p class="num m-0 font-display text-xl font-heading text-ink sm:text-2xl">{{ fmt.nullable(c.value, (n: number) => fmt.num(n)) }}</p>
        <p class="num m-0 flex items-center gap-1 text-sm text-ink-muted">
          <template v-if="c.delta !== null">
            <component :is="c.delta < 0 ? ChevronsDown : ChevronsUp" v-if="c.delta !== 0" class="size-4" aria-hidden="true" />
            <span class="sr-only">{{ t('beranda.daily') }}:</span>{{ signed(c.delta) }}
          </template>
          <template v-else>{{ t('stat.deltaNone') }}</template>
        </p>
        <p class="m-0 text-xs text-ink-muted"><time :datetime="c.asOf">{{ fmt.date(c.asOf) }}</time></p>
      </div>
    </div>
  </Card>
</template>

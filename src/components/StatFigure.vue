<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronsDown, ChevronsUp } from '@lucide/vue'
import { useFormat } from '@/app/useFormat'
import type { IsoDate } from '@/api/types'
import { Card } from '@/components/ui/card'
import StateMark from './StateMark.vue'
import type { DataState } from './StateMark.vue'

const props = defineProps<{
  state: DataState
  label: string
  value: number | null
  /** undefined hides the line, null says it is not available */
  delta?: number | null
  asOf: IsoDate
  emphasis?: boolean
}>()

const { t } = useI18n()
const fmt = useFormat()

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt.num(Math.abs(n))}`
const deltaText = computed(() =>
  props.delta === undefined ? null : props.delta === null ? t('stat.deltaNone') : t('stat.delta', { value: signed(props.delta) }),
)
// the role colour sits on a top rule and on the mark; the words and the numbers stay in the ink colour
const RULE: Record<DataState, string> = { positive: 'border-t-positive', recovered: 'border-t-recovered', deceased: 'border-t-deceased', active: 'border-t-active', rt: 'border-t-rt' }
</script>

<template>
  <Card class="gap-1 border-t-4 py-4" :class="RULE[state]">
    <div class="px-4">
      <p class="m-0 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        <StateMark :state="state" :size="3" />
        <span>{{ label }}</span>
      </p>
      <p class="num m-0 mt-1 font-display font-heading text-ink" :class="emphasis ? 'text-3xl' : 'text-2xl'">
        {{ fmt.nullable(value, (n: number) => fmt.num(n)) }}
      </p>
      <p v-if="deltaText" class="num m-0 mt-1 flex items-center gap-1 text-sm text-ink-muted">
        <component :is="(delta ?? 0) < 0 ? ChevronsDown : ChevronsUp" v-if="delta" class="size-4" aria-hidden="true" />
        {{ deltaText }}
      </p>
      <p class="m-0 mt-1 text-xs text-ink-muted"><time :datetime="asOf">{{ fmt.date(asOf) }}</time></p>
    </div>
  </Card>
</template>

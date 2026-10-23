<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import type { IsoDate } from '@/api/types'
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
</script>

<template>
  <div class="rounded-md border border-line bg-surface p-5">
    <p class="flex items-center gap-3 text-sm font-strong text-ink-muted">
      <StateMark :state="state" :size="3" />
      <span>{{ label }}</span>
    </p>
    <p class="num mt-2 font-display font-heading text-ink" :class="emphasis ? 'text-3xl' : 'text-2xl'">
      {{ fmt.nullable(value, (n: number) => fmt.num(n)) }}
    </p>
    <p v-if="deltaText" class="num mt-2 text-sm text-ink-muted">{{ deltaText }}</p>
    <p class="mt-2 text-xs text-ink-muted"><time :datetime="asOf">{{ fmt.date(asOf) }}</time></p>
  </div>
</template>

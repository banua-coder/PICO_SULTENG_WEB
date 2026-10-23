<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import { weaveFill } from './core/roles'
import type { Role } from './types'

// Coverage of a target: a woven bar, the percentage, and "x dari y" as text. Over 100 %: a full bar and "melebihi target".
const props = withDefaults(defineProps<{ value: number; target: number; label: string; role: Role; /** decimals of the percentage */ digits?: number }>(), { digits: 1 })
const { t } = useI18n()
const fmt = useFormat()

const ok = computed(() => props.target > 0)
const pct = computed(() => (ok.value ? (props.value / props.target) * 100 : null))
const over = computed(() => pct.value !== null && pct.value > 100)
const fill = computed(() => Math.min(100, Math.max(0, pct.value ?? 0)))
const of = computed(() => t('progress.of', { value: fmt.num(props.value), target: fmt.num(props.target) }))
const valueText = computed(() =>
  pct.value === null ? t('progress.na') : `${t('progress.text', { label: props.label, pct: fmt.num(pct.value, props.digits), of: of.value })}${over.value ? `, ${t('progress.over')}` : ''}`,
)
</script>

<template>
  <div>
    <p class="text-sm font-strong text-ink">{{ label }}</p>
    <div
      role="progressbar"
      :aria-label="label"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="pct === null ? undefined : Math.round(fill)"
      :aria-valuetext="valueText"
      class="mt-2 h-5 w-full overflow-hidden rounded-sm border border-line-strong bg-tint"
    >
      <svg v-if="ok" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="none">
        <rect x="0" y="0" :width="`${fill}%`" height="100%" :fill="weaveFill(role)" data-fill />
      </svg>
    </div>
    <p class="num mt-2 text-sm" data-testid="progress-text">
      <template v-if="pct !== null"><span class="font-strong">{{ fmt.pct(pct, digits) }}</span> · {{ of }}<span v-if="over"> · <span class="font-strong">{{ t('progress.over') }}</span></span></template>
      <template v-else>{{ t('progress.na') }}</template>
    </p>
  </div>
</template>

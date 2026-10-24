<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import StateMark from '../StateMark.vue'
import { legendClasses, legendRamp, rampVar } from './quantile'
import type { MapItem, MapMetric, MapMode } from './types'

const props = withDefaults(defineProps<{ items: MapItem[]; metric: MapMetric; mode?: MapMode; date?: string }>(), { mode: 'choropleth', date: undefined })
const { t } = useI18n()
const fmt = useFormat()
const rows = computed(() => (props.mode === 'points' ? legendRamp : legendClasses)(props.items.map((i) => i.value)))
const hasNull = computed(() => props.items.some((i) => i.value === null))
const text = (min: number, max: number) => (min === max ? fmt.num(min) : t('map.range', { min: fmt.num(min), max: fmt.num(max) }))
const title = computed(() => (props.mode === 'points' ? t('map.legend') : t('map.legendFill', { metric: props.metric.label })) + (props.date ? ` (${fmt.date(props.date)})` : ''))
</script>

<template>
  <div>
    <p class="m-0 text-sm font-strong text-ink-muted">{{ title }}</p>
    <ul class="m-0 mt-2 flex list-none flex-wrap items-center gap-x-4 gap-y-2 p-0 text-sm" data-testid="map-legend">
      <li v-for="r in rows" :key="r.step" class="num flex items-center gap-1" :data-step="r.step">
        <StateMark v-if="mode === 'points'" :state="metric.role" :size="r.step as 1" />
        <span v-else class="inline-block size-4 rounded-sm border border-line-strong" :style="{ background: rampVar(metric.role, r.step) }" aria-hidden="true" data-swatch />
        <span>{{ text(r.min, r.max) }}<template v-if="mode !== 'points'"> ({{ t('map.areas', { n: r.count }, r.count) }})</template></span>
      </li>
      <li v-if="hasNull" class="flex items-center gap-1" data-nodata>
        <span class="inline-block size-4 rounded-sm border border-line-strong" style="background: repeating-linear-gradient(45deg, var(--pico-tint) 0 3px, var(--pico-line-strong) 3px 5px)" aria-hidden="true" />
        <span>{{ t('map.noValue') }}</span>
      </li>
    </ul>
  </div>
</template>

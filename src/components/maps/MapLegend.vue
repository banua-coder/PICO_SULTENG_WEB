<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import StateMark from '../StateMark.vue'
import { legendRamp } from './quantile'
import type { MapItem, MapMetric } from './types'

const props = defineProps<{ items: MapItem[]; metric: MapMetric }>()
const { t } = useI18n()
const fmt = useFormat()
const rows = computed(() => legendRamp(props.items.map((i) => i.value)))
const text = (min: number, max: number) => (min === max ? fmt.num(min) : t('map.range', { min: fmt.num(min), max: fmt.num(max) }))
</script>

<template>
  <div>
    <p class="text-sm font-strong text-ink-muted">{{ t('map.legend') }}</p>
    <ul class="m-0 mt-3 flex list-none flex-wrap items-center gap-x-5 gap-y-3 p-0 text-sm" data-testid="map-legend">
      <li v-for="r in rows" :key="r.step" class="num flex items-center gap-2">
        <StateMark :state="metric.role" :size="r.step as 1" />
        <span>{{ text(r.min, r.max) }}</span>
      </li>
    </ul>
  </div>
</template>

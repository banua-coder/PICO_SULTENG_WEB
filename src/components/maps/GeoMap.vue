<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import RoleMark from '../charts/RoleMark.vue'
import { useChartSize, useMarkRamp } from '../charts/core/useChartSize'
import AreaTable from './AreaTable.vue'
import { bandsEnabled, loadBand } from './bands'
import MapLegend from './MapLegend.vue'
import { markSteps, readingOrder } from './quantile'
import type { PathItem } from './quantile'
import type { MapItem, MapMetric } from './types'

// The shared body of KabupatenMap and ProvinceMap: build-time paths, one focusable link per area, a proportional mark
// with its number at each centroid, a legend, and the table that holds the same numbers.
const props = withDefaults(
  defineProps<{
    paths: PathItem[]
    viewSize: [number, number]
    items: MapItem[]
    metric: MapMetric
    selected?: string
    hrefFor?: (code: string) => string
    /** Under this width (px) the marks and numbers are left to the table. 0 = never. */
    compactBelow?: number
    /** Table below the map instead of beside it, for maps that need the full width. */
    stacked?: boolean
  }>(),
  { selected: undefined, hrefFor: undefined, compactBelow: 0, stacked: false },
)
const emit = defineEmits<{ select: [code: string] }>()

const { t } = useI18n()
const fmt = useFormat()
const host = ref<HTMLElement>()
const width = useChartSize(host)
const ramp = useMarkRamp()

const k = computed(() => (width.value > 0 ? props.viewSize[0] / width.value : 1)) // user units per CSS px
const itemByCode = computed(() => new Map(props.items.map((i) => [i.code, i])))
const ordered = computed(() => readingOrder(props.paths).filter((p) => itemByCode.value.has(p.code)))
const steps = computed(() => {
  const s = markSteps(props.items.map((i) => i.value))
  return new Map(props.items.map((i, n) => [i.code, s[n] ?? null]))
})
const compact = computed(() => props.compactBelow > 0 && width.value > 0 && width.value < props.compactBelow)
const showMarks = computed(() => width.value > 0 && !compact.value)

const valueText = (i: MapItem) => fmt.nullable(i.value, (n: number) => fmt.num(n))
const label = (p: PathItem) => {
  const i = itemByCode.value.get(p.code)!
  return `${i.name}: ${valueText(i)}`
}
const markSize = (code: string) => (ramp.value[(steps.value.get(code) ?? 1) - 1] ?? 8) * k.value
const moved = (p: PathItem) => p.labelX !== p.cx || p.labelY !== p.cy
const hitR = computed(() => 22 * k.value) // 44 CSS px hit target for small areas

// identity band for the selected area: off unless VITE_MAP_BANDS=1 (cultural review pending)
const band = ref<{ inner: string; w: number; h: number } | null>(null)
const selectedName = computed(() => (props.selected ? itemByCode.value.get(props.selected)?.name : undefined))
async function refreshBand() {
  band.value = null
  if (bandsEnabled() && selectedName.value) band.value = await loadBand(selectedName.value)
}
onMounted(refreshBand)
watch(() => props.selected, refreshBand)
const selectedPath = computed(() => props.paths.find((p) => p.code === props.selected))

function activate(e: KeyboardEvent, code: string) {
  e.preventDefault()
  emit('select', code)
}
</script>

<template>
  <div class="grid items-start gap-6" :class="stacked ? '' : 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'">
    <figure class="m-0">
      <figcaption class="mb-3 font-display text-md font-heading text-indigo">{{ t('map.mapLabel', { metric: metric.label }) }}</figcaption>
      <div ref="host" class="w-full" :style="{ aspectRatio: `${viewSize[0]} / ${viewSize[1]}` }">
        <svg :viewBox="`0 0 ${viewSize[0]} ${viewSize[1]}`" role="group" :aria-label="t('map.mapLabel', { metric: metric.label })" class="block h-full w-full" data-testid="geo-map">
          <defs v-if="band && selectedPath">
            <pattern :id="`band-${selected}`" patternUnits="userSpaceOnUse" :width="band.w" :height="band.h" :patternTransform="`scale(${k})`">
              <!-- eslint-disable-next-line vue/no-v-html -- trusted brand strip -->
              <g v-html="band.inner" />
            </pattern>
          </defs>

          <g v-for="p in ordered" :key="p.code" role="link" tabindex="0" class="map-area" :data-code="p.code" :aria-label="label(p)" :aria-current="p.code === selected ? 'true' : undefined" @click="emit('select', p.code)" @keydown.enter="activate($event, p.code)" @keydown.space="activate($event, p.code)">
            <path :d="p.d" fill-rule="evenodd" :style="{ fill: 'var(--pico-tint)', stroke: 'var(--pico-line-strong)', strokeWidth: `${k}px` }" stroke-linejoin="round" />
            <path v-if="p.code === selected && band" :d="p.d" fill-rule="evenodd" :fill="`url(#band-${selected})`" data-band />
            <circle v-if="moved(p) && width > 0" :cx="p.cx" :cy="p.cy" :r="hitR" fill="transparent" data-hit />
          </g>

          <!-- the selected area, outlined on top so neighbours cannot hide its border -->
          <path v-if="selectedPath" :d="selectedPath.d" fill="none" fill-rule="evenodd" stroke-linejoin="round" :style="{ stroke: 'var(--pico-indigo)', strokeWidth: `${2 * k}px` }" class="pointer-events-none" aria-hidden="true" data-selected />

          <!-- proportional marks and their numbers: size and text carry magnitude, never colour -->
          <g v-if="showMarks" class="pointer-events-none" aria-hidden="true" data-marks>
            <template v-for="p in ordered" :key="`m${p.code}`">
              <g v-if="itemByCode.get(p.code)!.value !== null" :data-mark-for="p.code">
                <path v-if="moved(p)" :d="`M${p.cx} ${p.cy}L${p.labelX} ${p.labelY}`" fill="none" :style="{ stroke: 'var(--pico-ink-muted)', strokeWidth: `${k}px` }" data-leader />
                <RoleMark :role="metric.role" :x="p.cx" :y="p.cy" :size="markSize(p.code)" />
                <text :x="p.labelX" :y="p.labelY + (moved(p) ? 0 : markSize(p.code) / 2 + 12 * k)" text-anchor="middle" dominant-baseline="central" class="num" :style="{ fill: 'var(--pico-ink)', fontSize: `${12 * k}px`, stroke: 'var(--pico-tint)', strokeWidth: `${3 * k}px`, paintOrder: 'stroke' }" data-value>{{ valueText(itemByCode.get(p.code)!) }}</text>
              </g>
            </template>
          </g>
        </svg>
      </div>
      <MapLegend v-if="!compact" class="mt-4" :items="items" :metric="metric" />
    </figure>
    <AreaTable :items="items" :metric="metric" :selected="selected" :href-for="hrefFor" @select="emit('select', $event)" />
  </div>
</template>

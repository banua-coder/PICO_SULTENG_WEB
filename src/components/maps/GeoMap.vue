<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { Minus, Plus, RotateCcw } from '@lucide/vue'
import { useFormat } from '@/app/useFormat'
import StateMark from '../StateMark.vue'
import RoleMark from '../charts/RoleMark.vue'
import { useChartSize, useMarkRamp } from '../charts/core/useChartSize'
import AreaTable from './AreaTable.vue'
import MapLegend from './MapLegend.vue'
import { classSteps, lightText, markSteps, rampVar, readingOrder } from './quantile'
import type { PathItem } from './quantile'
import type { MapItem, MapProps } from './types'
import { fullView, panBy, zoomAt, zoomLevel } from './zoom'
import type { VB } from './zoom'
import '@/styles/palette-ramps.css'

// The shared body of KabupatenMap and ProvinceMap: build-time paths, one focusable link per area, areas filled by quantile class
// (Sebaran) or a proportional mark at each centroid (Titik), the number of each area as text, a legend, a tooltip with the four
// case numbers, zoom and pan by the viewBox, and the table that holds the same numbers.
const props = withDefaults(
  defineProps<
    MapProps & {
      paths: PathItem[]
      viewSize: [number, number]
      /** Under this width (px) the numbers are left to the table. 0 = never. */
      compactBelow?: number
      /** Table below the map instead of beside it, for maps that need the full width. */
      stacked?: boolean
    }
  >(),
  { selected: undefined, hrefFor: undefined, compactBelow: 0, stacked: false, mode: 'choropleth', areaName: undefined, date: undefined, pin: undefined },
)
const emit = defineEmits<{ select: [code: string] }>()

const { t, locale } = useI18n()
const fmt = useFormat()
const uid = useId()
const host = ref<HTMLElement>()
const width = useChartSize(host)
const ramp = useMarkRamp()

const vb = ref<VB>(fullView(props.viewSize))
const zoom = computed(() => zoomLevel(vb.value, props.viewSize))
const k = computed(() => (width.value > 0 ? vb.value.w / width.value : 1)) // user units per CSS px, at the current zoom
const itemByCode = computed(() => new Map(props.items.map((i) => [i.code, i])))
const ordered = computed(() => readingOrder(props.paths).filter((p) => itemByCode.value.has(p.code)))
const points = computed(() => props.mode === 'points')
// Sebaran: up to 9 quantile classes on the 9-step ramp. Titik: the 6-step mark size.
const steps = computed(() => {
  const s = (points.value ? markSteps : classSteps)(props.items.map((i) => i.value))
  return new Map(props.items.map((i, n) => [i.code, s[n] ?? null]))
})
const compact = computed(() => props.compactBelow > 0 && width.value > 0 && width.value < props.compactBelow)
const showMarks = computed(() => width.value > 0 && !compact.value)
const hatch = `hatch-${uid}`

const valueText = (i: MapItem) => fmt.nullable(i.value, (n: number) => fmt.num(n))
const label = (p: PathItem) => {
  const i = itemByCode.value.get(p.code)!
  return `${i.name}: ${valueText(i)}`
}
const markSize = (code: string) => (ramp.value[(steps.value.get(code) ?? 1) - 1] ?? 8) * k.value
const moved = (p: PathItem) => p.labelX !== p.cx || p.labelY !== p.cy
const hitR = computed(() => 22 * k.value) // 44 CSS px hit target for small areas
const selectedPath = computed(() => props.paths.find((p) => p.code === props.selected))
const role = computed(() => props.metric.role)

const fillOf = (code: string) => {
  if (points.value) return 'var(--pico-tint)'
  const s = steps.value.get(code)
  return s ? rampVar(role.value, s) : `url(#${hatch})`
}
const textStyle = (p: PathItem) => {
  const s = steps.value.get(p.code)!
  const inside = !points.value && !moved(p)
  const fill = inside ? (lightText(role.value, s) ? 'var(--pico-ramp-paper)' : 'var(--pico-ramp-ink)') : 'var(--pico-ink)'
  const halo = inside ? rampVar(role.value, s) : 'var(--pico-tint)'
  return { fill, fontSize: `${12 * k.value}px`, stroke: halo, strokeWidth: `${3 * k.value}px`, paintOrder: 'stroke' }
}

function activate(e: KeyboardEvent, code: string) {
  e.preventDefault()
  emit('select', code)
}

// ---- tooltip: pointer and keyboard focus show the same card ----
const tip = ref<{ code: string; x: number; y: number } | null>(null)
const tipItem = computed(() => (tip.value ? itemByCode.value.get(tip.value.code) : undefined))
const CASES = [
  { key: 'positive', state: 'positive' },
  { key: 'active', state: 'active' },
  { key: 'recovered', state: 'recovered' },
  { key: 'deceased', state: 'deceased' },
] as const
function showTip(code: string, e: PointerEvent | FocusEvent) {
  const box = host.value?.getBoundingClientRect()
  if (!box) return
  if ('clientX' in e) tip.value = { code, x: e.clientX - box.left, y: e.clientY - box.top }
  else {
    const r = (e.currentTarget as Element).getBoundingClientRect()
    tip.value = { code, x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
  }
}
const tipStyle = computed(() => {
  const p = tip.value
  if (!p) return {}
  return { top: `${Math.max(4, p.y - 8)}px`, ...(p.x > width.value / 2 ? { right: `${width.value - p.x + 12}px` } : { left: `${p.x + 12}px` }) }
})

// ---- zoom and pan: +/- buttons, Ctrl/Cmd + wheel (and trackpad pinch), two-finger pinch, one-finger or mouse drag when zoomed ----
const zoomBy = (f: number, fx = 0.5, fy = 0.5) => (vb.value = zoomAt(vb.value, props.viewSize, f, fx, fy))
const reset = () => (vb.value = fullView(props.viewSize))
// A plain wheel zooms only once the map is armed: after a click or focus on it, until blur or Escape. Ctrl/Cmd + wheel always works.
const armed = ref(false)
function onFocusOut(e: FocusEvent) {
  if (!host.value?.contains(e.relatedTarget as Node | null)) armed.value = false
}
function onWheel(e: WheelEvent) {
  if (!e.ctrlKey && !e.metaKey && !armed.value) return // else the page keeps scrolling
  e.preventDefault()
  const r = host.value!.getBoundingClientRect()
  zoomBy(e.deltaY < 0 ? 1.25 : 0.8, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
}
const pointers = new Map<number, { x: number; y: number }>()
let dragged = false
let pinch = 0
const dist = () => {
  const [a, b] = [...pointers.values()]
  return Math.hypot(a!.x - b!.x, a!.y - b!.y)
}
function onDown(e: PointerEvent) {
  if (e.pointerType !== 'touch') armed.value = true
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  dragged = false
  if (pointers.size === 2) pinch = dist()
}
function onMove(e: PointerEvent) {
  const p = pointers.get(e.pointerId)
  if (!p) return
  if (pointers.size === 2) {
    p.x = e.clientX
    p.y = e.clientY
    const d = dist()
    if (pinch > 0) zoomBy(d / pinch)
    pinch = d
    dragged = true
    return
  }
  const dx = e.clientX - p.x
  const dy = e.clientY - p.y
  if (zoom.value <= 1 || (!dragged && Math.hypot(dx, dy) < 4)) return
  dragged = true
  p.x = e.clientX
  p.y = e.clientY
  vb.value = panBy(vb.value, props.viewSize, -dx * k.value, -dy * k.value)
}
const onUp = (e: PointerEvent) => pointers.delete(e.pointerId)
// a drag that ends on an area must not count as a click on it
const onClickCapture = (e: MouseEvent) => {
  if (dragged) {
    e.stopPropagation()
    dragged = false
  }
}
const btn = 'inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border border-line-strong bg-surface text-ink hover:bg-accent disabled:opacity-50'
const title = computed(() => (props.areaName ? t('map.title', { metric: props.metric.label.toLocaleLowerCase(locale.value), area: props.areaName }) : t('map.mapLabel', { metric: props.metric.label })))
</script>

<template>
  <div class="grid items-start gap-6" :class="stacked ? '' : 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'">
    <figure class="m-0">
      <figcaption class="mb-2 font-display text-md font-heading text-ink">{{ title }}</figcaption>
      <div class="relative">
        <div class="absolute right-2 top-2 z-10 flex flex-col gap-1" role="group" :aria-label="t('map.zoom')">
          <button type="button" :class="btn" :aria-label="t('map.zoomIn')" data-zoom="in" @click="zoomBy(1.5)"><Plus class="size-5" aria-hidden="true" /></button>
          <button type="button" :class="btn" :aria-label="t('map.zoomOut')" data-zoom="out" :disabled="zoom <= 1" @click="zoomBy(1 / 1.5)"><Minus class="size-5" aria-hidden="true" /></button>
          <button type="button" :class="btn" :aria-label="t('map.zoomReset')" data-zoom="reset" :disabled="zoom <= 1" @click="reset"><RotateCcw class="size-5" aria-hidden="true" /></button>
        </div>
        <div
          ref="host"
          class="relative w-full overflow-hidden rounded-sm"
          :style="{ aspectRatio: `${viewSize[0]} / ${viewSize[1]}`, touchAction: zoom > 1 ? 'none' : 'pan-y' }"
          data-testid="geo-host"
          tabindex="-1"
          @wheel="onWheel"
          @focusin="armed = true"
          @focusout="onFocusOut"
          @keydown.esc="armed = false"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
          @click.capture="onClickCapture"
        >
          <svg :viewBox="`${vb.x} ${vb.y} ${vb.w} ${vb.h}`" role="group" :aria-label="title" class="block h-full w-full" data-testid="geo-map" :data-mode="mode" :data-zoom-level="zoom.toFixed(2)">
            <defs>
              <pattern :id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" style="fill: var(--pico-tint)" />
                <line x1="0" y1="0" x2="0" y2="6" style="stroke: var(--pico-line-strong)" stroke-width="2" />
              </pattern>
            </defs>
            <g
              v-for="p in ordered"
              :key="p.code"
              role="link"
              tabindex="0"
              class="map-area"
              :data-code="p.code"
              :data-step="steps.get(p.code) ?? undefined"
              :aria-label="label(p)"
              :aria-current="p.code === selected ? 'true' : undefined"
              @click="emit('select', p.code)"
              @keydown.enter="activate($event, p.code)"
              @keydown.space="activate($event, p.code)"
              @pointerenter="showTip(p.code, $event)"
              @pointermove="showTip(p.code, $event)"
              @pointerleave="tip = null"
              @focus="showTip(p.code, $event)"
              @blur="tip = null"
            >
              <path :d="p.d" fill-rule="evenodd" :style="{ fill: fillOf(p.code), stroke: 'var(--pico-line-strong)', strokeWidth: `${k}px` }" stroke-linejoin="round" data-fill />
              <circle v-if="moved(p) && width > 0" :cx="p.cx" :cy="p.cy" :r="hitR" fill="transparent" data-hit />
            </g>

            <!-- the selected area, outlined on top so neighbours cannot hide its border -->
            <path v-if="selectedPath" :d="selectedPath.d" fill="none" fill-rule="evenodd" stroke-linejoin="round" :style="{ stroke: 'var(--pico-indigo)', strokeWidth: `${2.5 * k}px` }" class="pointer-events-none" aria-hidden="true" data-selected />

            <!-- Titik: proportional marks. Sebaran: the number only. Either way the number is text, never colour alone -->
            <g v-if="showMarks" class="pointer-events-none" aria-hidden="true" data-marks>
              <template v-for="p in ordered" :key="`m${p.code}`">
                <g v-if="itemByCode.get(p.code)!.value !== null" :data-mark-for="p.code">
                  <path v-if="moved(p)" :d="`M${p.cx} ${p.cy}L${p.labelX} ${p.labelY}`" fill="none" :style="{ stroke: 'var(--pico-ink-muted)', strokeWidth: `${k}px` }" data-leader />
                  <RoleMark v-if="points" :role="metric.role" :x="p.cx" :y="p.cy" :size="markSize(p.code)" />
                  <text
                    :x="p.labelX"
                    :y="p.labelY + (points && !moved(p) ? markSize(p.code) / 2 + 12 * k : 0)"
                    text-anchor="middle"
                    dominant-baseline="central"
                    class="num"
                    :style="textStyle(p)"
                    data-value
                  >{{ valueText(itemByCode.get(p.code)!) }}</text>
                </g>
              </template>
            </g>
          </svg>

          <div v-if="tip && tipItem" class="pointer-events-none absolute z-20 rounded-sm border border-line-strong bg-surface p-2 text-xs text-ink shadow-card" :style="tipStyle" aria-hidden="true" data-tooltip>
            <p class="m-0 font-strong">{{ tipItem.name }}</p>
            <table v-if="tipItem.detail" class="num mt-1 border-collapse">
              <tbody>
                <tr v-for="c in CASES" :key="c.key">
                  <td class="pr-3"><span class="flex items-center gap-1"><StateMark :state="c.state" :size="2" />{{ t(`state.${c.key}`) }}</span></td>
                  <td class="text-right font-strong">{{ fmt.nullable(tipItem.detail[c.key], (n: number) => fmt.num(n)) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="num m-0">{{ metric.label }}: {{ valueText(tipItem) }}</p>
          </div>
        </div>
      </div>
      <p v-if="zoom > 1" class="m-0 mt-1 text-xs text-ink-muted">{{ t('map.zoomHint') }}</p>
      <p role="status" aria-live="polite" class="m-0 mt-1 text-xs text-ink-muted" data-testid="wheel-hint" :data-armed="armed">{{ armed ? t('map.wheelOn') : t('map.wheelHint') }}</p>
      <MapLegend class="mt-3" :items="items" :metric="metric" :mode="mode" :date="date" />
    </figure>
    <AreaTable :items="items" :metric="metric" :selected="selected" :pin="pin" :href-for="hrefFor" @select="emit('select', $event)" />
  </div>
</template>

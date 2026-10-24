<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import Illustration from '../Illustration.vue'
import Axis from './Axis.vue'
import ChartTable from './ChartTable.vue'
import { buildRtModel, fullYMax } from './core/rtModel'
import { spreadLabels } from './core/scales'
import { extentOf, useZoom } from './core/useZoom'
import ZoomControls from './ZoomControls.vue'
import { useChartSize, useMarkSize } from './core/useChartSize'
import { useChartFocus } from './core/useFocus'
import RoleMark from './RoleMark.vue'
import { Button } from '@/components/ui/button'
import { LineChart, Table2 } from '@lucide/vue'
import type { BandPoint, ChartA11y } from './types'

const props = withDefaults(defineProps<{ points: BandPoint[]; range?: [IsoDate, IsoDate]; a11y: ChartA11y; height?: number; yMax?: number }>(), {
  range: undefined,
  height: 280,
  yMax: 4,
})
const emit = defineEmits<{ 'focus-date': [date: IsoDate | null] }>()

const { t } = useI18n()
const fmt = useFormat()
const uid = useId()
const box = ref<HTMLElement>()
const surface = ref<HTMLElement>()
const width = useChartSize(box)
const markPx = useMarkSize(3)
const asTable = ref(false)

// The legacy axis ran to 12 and showed the whole 7.5 peak: the default is the full scale; the cut at yMax is the opt-in 'Skala dipotong'
const clipped = ref(false)
const full = computed(() => props.range ?? extentOf(props.points.map((p) => p.x)))
const zoom = useZoom({ full, surface, marginLeft: () => model.value.margin.left, plotW: () => model.value.plotW, xInvert: (px) => model.value.xInvert(px) })
const yMaxNow = computed(() => (clipped.value ? props.yMax : fullYMax(props.points, zoom.range.value)))
const model = computed(() => buildRtModel({ points: props.points, range: zoom.range.value, width: width.value, height: props.height, yMax: yMaxNow.value }))
// end labels of the estimate and the two bounds, pushed apart so they never overlap
const endLabels = computed(() => {
  const m = model.value
  if (!m.end || !m.endUpper || !m.endLower) return []
  const rows = [
    { id: 'rt', y: m.end.y, label: t('chart.rtEstimate') },
    { id: 'hi', y: m.endUpper.y, label: t('chart.rtHighShort') },
    { id: 'lo', y: m.endLower.y, label: t('chart.rtLowShort') },
  ]
  const ys = spreadLabels(rows.map((r) => r.y), 14, 6, m.plotH)
  return rows.map((r, i) => ({ ...r, labelY: ys[i]! }))
})
const drawn = computed(() => width.value > 0)
const rt = (n: number) => fmt.num(n, 2)

const xLabels = computed(() => model.value.xTicks.ticks.map((tk) => ({ pos: tk.pos, label: model.value.xTicks.kind === 'year' ? fmt.year(tk.date) : fmt.month(tk.date) })))
const yLabels = computed(() => model.value.yTicks.map((tk) => ({ pos: tk.pos, label: fmt.num(tk.value) })))

const focus = useChartFocus({
  dates: computed(() => model.value.dates),
  surface,
  xInvert: (px) => model.value.xInvert(px),
  marginLeft: () => model.value.margin.left,
  plotW: () => model.value.plotW,
  onChange: (d) => emit('focus-date', d),
})
const focusDate = focus.date
const { onFocus, onBlur, onPointer, onLeave } = focus
const onKey = (e: KeyboardEvent) => (zoom.onKey(e) ? undefined : focus.onKey(e))
const onMove = (e: PointerEvent) => {
  onPointer(e)
  zoom.onMove(e)
}
const focusValue = computed(() => (focusDate.value ? model.value.valueAt(focusDate.value) : null))
const liveText = computed(() => {
  const d = focusDate.value
  if (!d) return ''
  const v = focusValue.value
  return v ? t('chart.rtFocus', { date: fmt.date(d), value: rt(v.value), lo: rt(v.lo), hi: rt(v.hi) }) : t('chart.rtNone', { date: fmt.date(d) })
})
const focusX = computed(() => (focusDate.value ? model.value.x(focusDate.value) : 0))
const tipSide = computed(() => {
  const x = model.value.margin.left + focusX.value
  return x > model.value.width / 2 ? { right: `${model.value.width - x + 12}px` } : { left: `${x + 12}px` }
})
const hintId = `${uid}-hint`
const tableCols = computed(() => [
  { id: 'rt', label: t('chart.rtEstimate') },
  { id: 'lo', label: t('chart.rtLow') },
  { id: 'hi', label: t('chart.rtHigh') },
])
const tablePoints = computed(() => [
  model.value.visible.map((p) => ({ x: p.x, y: p.y })),
  model.value.visible.map((p) => ({ x: p.x, y: p.lo })),
  model.value.visible.map((p) => ({ x: p.x, y: p.hi })),
])
const stripe = 'var(--pico-rt)'
</script>

<template>
  <figure class="m-0" data-chart="rt">
    <figcaption class="mb-2 font-display text-md font-heading text-ink">{{ a11y.title }}</figcaption>

    <div ref="box" :style="{ height: `${height}px` }" class="relative w-full" data-kind="rt">
      <template v-if="!asTable && drawn">
        <p v-if="!model.hasAny" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-ink-muted" data-testid="rt-empty"><Illustration name="state-periode-kosong" :width="96" />{{ t('chart.rtEmpty') }}</p>
        <div
          v-else
          ref="surface"
          role="group"
          tabindex="0"
          :aria-label="`${a11y.title}. ${t('chart.plot')}`"
          :aria-describedby="hintId"
          class="relative h-full w-full touch-pan-y select-none rounded-sm"
          @keydown="onKey"
          @focus="onFocus"
          @blur="onBlur"
          @pointerdown="zoom.onDown"
          @pointermove="onMove"
          @pointerup="zoom.onUp"
          @pointercancel="zoom.onUp"
          @pointerleave="onLeave"
          @wheel="zoom.onWheel"
          @focusin="zoom.arm"
          @focusout="zoom.disarm"
        >
          <svg :width="model.width" :height="model.height" role="img" :aria-label="a11y.summary" class="block">
            <g :transform="`translate(${model.margin.left} ${model.margin.top})`">
              <Axis :plot-w="model.plotW" :plot-h="model.plotH" :x="xLabels" :y="yLabels" />

              <!-- the 95 % band: a grey area between the lower and the upper bound -->
              <path :d="model.band" :fill="stripe" fill-opacity="0.2" stroke="none" data-rt-band />
              <!-- the two bounds as thin lines: upper solid, lower dashed -->
              <path :d="model.upperLine" fill="none" stroke-linejoin="round" :style="{ stroke: 'var(--pico-rt)' }" stroke-width="1" stroke-opacity="0.85" data-rt-upper />
              <path :d="model.lowerLine" fill="none" stroke-linejoin="round" :style="{ stroke: 'var(--pico-rt)' }" stroke-width="1" stroke-opacity="0.85" stroke-dasharray="4 3" data-rt-lower />
              <!-- Rt = 1, dashed, with its label on a halo so the text never sits on the hatch -->
              <g v-if="model.threshold !== null" data-threshold>
                <line :x1="0" :x2="model.plotW" :y1="model.threshold" :y2="model.threshold" :style="{ stroke: 'var(--pico-ink)' }" stroke-width="1.5" stroke-dasharray="6 4" />
                <text :x="6" :y="model.threshold - 6" :style="{ fill: 'var(--pico-ink)', fontSize: 'var(--pico-text-xs)', stroke: 'var(--pico-surface)', strokeWidth: '3px', paintOrder: 'stroke' }">{{ t('chart.rtThreshold') }}</text>
              </g>
              <!-- the estimate thread: solid -->
              <path :d="model.thread" fill="none" stroke-linejoin="round" :style="{ stroke: 'var(--pico-rt)', strokeWidth: 'var(--pico-line-width)' }" data-line />

              <!-- values above the axis: a ring at the top edge with the number -->
              <g v-for="c in model.clipped" :key="c.date" data-clipped>
                <RoleMark role="rt" :x="c.x" :y="0" :size="markPx + 2" />
                <text :x="c.x" :y="-1" dy="-8" text-anchor="middle" :style="{ fill: 'var(--pico-ink)', fontSize: 'var(--pico-text-xs)', stroke: 'var(--pico-surface)', strokeWidth: '3px', paintOrder: 'stroke' }" class="num">{{ rt(c.value) }}</text>
              </g>

              <g v-for="l in endLabels" :key="l.id" :data-end-label="l.id">
                <path :d="`M${model.end!.x} ${l.id === 'hi' ? model.endUpper!.y : l.id === 'lo' ? model.endLower!.y : model.end!.y} L${model.plotW + 6} ${l.labelY}`" fill="none" :style="{ stroke: 'var(--pico-line-strong)' }" stroke-width="1" aria-hidden="true" />
                <RoleMark v-if="l.id === 'rt'" role="rt" :x="model.plotW + 14" :y="l.labelY" :size="markPx" />
                <text :x="model.plotW + (l.id === 'rt' ? 14 + markPx : 10)" :y="l.labelY" dominant-baseline="central" :style="{ fill: 'var(--pico-ink)', fontSize: 'var(--pico-text-xs)' }">{{ l.label }}</text>
              </g>

              <rect v-if="zoom.brushRect.value" :x="zoom.brushRect.value.x" y="0" :width="zoom.brushRect.value.w" :height="model.plotH" :style="{ fill: 'var(--pico-primary)' }" fill-opacity="0.18" aria-hidden="true" data-brush />

              <g v-if="focusDate" aria-hidden="true" data-crosshair>
                <line :x1="focusX" :x2="focusX" :y1="0" :y2="model.plotH" :style="{ stroke: 'var(--pico-ink)' }" stroke-width="1" stroke-dasharray="2 3" />
                <RoleMark v-if="focusValue" role="rt" :x="focusX" :y="model.y(focusValue.value)" :size="markPx + 4" />
              </g>
            </g>
          </svg>

          <div v-if="focusDate" class="pointer-events-none absolute top-2 z-10 rounded-sm border border-line-strong bg-surface p-2 text-xs text-ink" :style="tipSide" aria-hidden="true" data-tooltip>
            <p class="num font-strong">{{ fmt.date(focusDate) }}</p>
            <template v-if="focusValue">
              <p class="num">{{ t('chart.rtEstimate') }} {{ rt(focusValue.value) }}</p>
              <p class="num">{{ t('chart.rtHigh') }} (95 %) {{ rt(focusValue.hi) }}</p>
              <p class="num">{{ t('chart.rtLow') }} (95 %) {{ rt(focusValue.lo) }}</p>
            </template>
            <p v-else class="num">Rt {{ t('format.notAvailable') }}</p>
          </div>
        </div>
        <p :id="hintId" class="sr-only">{{ t('chart.hint') }}</p>
        <p role="status" aria-live="polite" class="sr-only" data-testid="chart-live">{{ liveText }}</p>
      </template>
    </div>

    <ul v-if="!asTable && model.hasAny" class="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm" data-testid="rt-legend">
      <li class="flex items-center gap-2"><svg width="22" height="12" aria-hidden="true"><line x1="0" x2="22" y1="6" y2="6" :style="{ stroke: 'var(--pico-rt)', strokeWidth: 'var(--pico-line-width)' }" /></svg>{{ t('chart.rtEstimateFull') }}</li>
      <li class="flex items-center gap-2"><svg width="22" height="12" aria-hidden="true"><rect width="22" height="12" :style="{ fill: 'var(--pico-rt)' }" fill-opacity="0.2" /><line x1="0" x2="22" y1="1" y2="1" :style="{ stroke: 'var(--pico-rt)' }" /></svg>{{ t('chart.rtHigh') }} (95 %)</li>
      <li class="flex items-center gap-2"><svg width="22" height="12" aria-hidden="true"><rect width="22" height="12" :style="{ fill: 'var(--pico-rt)' }" fill-opacity="0.2" /><line x1="0" x2="22" y1="11" y2="11" stroke-dasharray="4 3" :style="{ stroke: 'var(--pico-rt)' }" /></svg>{{ t('chart.rtLow') }} (95 %)</li>
      <li class="flex items-center gap-2"><svg width="22" height="12" aria-hidden="true"><line x1="0" x2="22" y1="6" y2="6" stroke-dasharray="6 4" stroke-width="1.5" :style="{ stroke: 'var(--pico-ink)' }" /></svg>{{ t('chart.rtThreshold') }}</li>
    </ul>
    <!-- one hint paragraph: what the lines are, which scale, and how to zoom -->
    <p v-if="!asTable && model.hasAny" class="mt-2 text-sm text-ink-muted" data-testid="rt-key">
      {{ t('chart.rtKey') }} {{ clipped ? t('chart.rtNoteCut', { max: fmt.num(yMaxNow) }) : t('chart.rtNoteFull', { max: fmt.num(yMaxNow) }) }}
      {{ t('chart.zoomAll') }} <span data-testid="wheel-hint" :data-armed="zoom.armed.value">{{ zoom.armed.value ? t('chart.wheelOn') : t('chart.wheelHint') }}</span>
    </p>
    <p v-if="!asTable && model.clipped.length" class="num mt-1 text-sm text-ink-muted" data-testid="rt-clipped">{{ t('chart.rtClippedList', { items: model.clipped.map((c) => `${rt(c.value)} (${fmt.date(c.date, 'short')})`).join(', ') }) }}</p>
    <p v-if="asTable && zoom.zoomed.value" class="mt-2 text-sm text-ink-muted" data-testid="table-zoom-note">{{ t('chart.tableZoomed') }}</p>
    <ChartTable v-if="asTable" :caption="a11y.title" :columns="tableCols" :dates="model.dates" :values="tablePoints" :digits="2" />
    <Button type="button" variant="outline" size="sm" class="mt-3 text-primary-strong" :aria-pressed="asTable" @click="asTable = !asTable">
      <component :is="asTable ? LineChart : Table2" aria-hidden="true" />{{ asTable ? t('chart.graph') : t('chart.table') }}
    </Button>
    <Button type="button" variant="outline" size="sm" class="ml-2 mt-3 text-primary-strong" :aria-pressed="clipped" data-testid="rt-scale" @click="clipped = !clipped">{{ t('chart.rtScaleClip') }}</Button>
    <ZoomControls v-if="!asTable" :zoom="zoom" :range="zoom.range.value" :hints="false" />
  </figure>
</template>

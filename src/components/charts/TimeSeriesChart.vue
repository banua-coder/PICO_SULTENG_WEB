<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import StateMark from '../StateMark.vue'
import Axis from './Axis.vue'
import ChartTable from './ChartTable.vue'
import { buildModel } from './core/model'
import { lineForm, roleFill } from './core/roles'
import { useChartSize, useMarkSize } from './core/useChartSize'
import { useChartFocus } from './core/useFocus'
import { extentOf, useZoom } from './core/useZoom'
import ZoomControls from './ZoomControls.vue'
import RoleMark from './RoleMark.vue'
import { Button } from '@/components/ui/button'
import { LineChart, Table2 } from '@lucide/vue'
import type { ChartA11y, LineSeries } from './types'

const props = withDefaults(
  defineProps<{
    series: LineSeries[]
    kind: 'line' | 'bar'
    /** a line over the bars (a moving average) */
    overlay?: LineSeries
    /** the date whose bar gets the one crimson accent of the view */
    peak?: IsoDate
    range?: [IsoDate, IsoDate]
    a11y: ChartA11y
    height?: number
  }>(),
  { overlay: undefined, peak: undefined, range: undefined, height: 280 },
)
const emit = defineEmits<{ 'focus-date': [date: IsoDate | null] }>()

const { t, locale } = useI18n()
const fmt = useFormat()
const uid = useId()

const box = ref<HTMLElement>()
const surface = ref<HTMLElement>()
const width = useChartSize(box)
const markPx = useMarkSize(3)
const asTable = ref(false)

// the page's range (presets, calendar) is the full view; zoom works inside it and resets when it changes
const full = computed(() => props.range ?? extentOf(props.series.flatMap((s) => s.points.map((p) => p.x))))
const zoom = useZoom({ full, surface, marginLeft: () => model.value.margin.left, plotW: () => model.value.plotW, xInvert: (px) => model.value.xInvert(px) })
const model = computed(() => buildModel({ series: props.series, kind: props.kind, overlay: props.overlay, range: zoom.range.value, width: width.value, height: props.height }))
const drawn = computed(() => width.value > 0)
const empty = computed(() => model.value.dates.length === 0)

const xLabels = computed(() =>
  model.value.xTicks.ticks.map((tk) => ({ pos: tk.pos, label: model.value.xTicks.kind === 'year' ? fmt.year(tk.date) : fmt.month(tk.date) })),
)
const yLabels = computed(() => model.value.yTicks.map((tk) => ({ pos: tk.pos, label: fmt.num(tk.value) })))

// ---- focus: keyboard and pointer share one index into the visible dates ----
const surfaceRef = surface
const focus = useChartFocus({
  dates: computed(() => model.value.dates),
  surface: surfaceRef,
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

const focusValues = computed(() => (focusDate.value ? model.value.valuesAt(focusDate.value) : []))
const liveText = computed(() => {
  const d = focusDate.value
  if (!d) return ''
  const values = focusValues.value.map((v) => `${v.label.toLocaleLowerCase(locale.value)} ${fmt.nullable(v.value, (n: number) => fmt.num(n))}`).join(', ')
  return t('chart.focus', { date: fmt.date(d), values })
})

const focusX = computed(() => (focusDate.value ? model.value.x(focusDate.value) : 0))
const tipLeft = computed(() => {
  const x = model.value.margin.left + focusX.value
  return x > model.value.width / 2 ? { right: `${model.value.width - x + 12}px` } : { left: `${x + 12}px` }
})
const hintId = `${uid}-hint`
const tableCols = computed(() => (props.overlay && props.kind === 'bar' ? [...props.series, props.overlay] : props.series).map((s) => ({ id: s.id, label: s.label })))
const tablePoints = computed(() => model.value.visible)
// a legend whenever there are two or more series (the direct labels at the line ends stay)
const legend = computed(() => [...props.series, ...(props.overlay ? [props.overlay] : [])].map((s) => ({ id: s.id + (s === props.overlay ? '-avg' : ''), label: s.label, state: s.form?.shape ?? s.role, color: s.form?.color })))
</script>

<template>
  <figure class="m-0" data-chart="timeseries">
    <figcaption class="mb-2 font-display text-md font-heading text-ink">{{ a11y.title }}</figcaption>

    <ul v-if="legend.length >= 2" class="m-0 mb-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm" data-testid="legend">
      <li v-for="l in legend" :key="l.id" class="flex items-center gap-2"><StateMark :state="l.state" :color="l.color" :size="2" /><span>{{ l.label }}</span></li>
    </ul>

    <div ref="box" :style="{ height: `${height}px` }" class="relative w-full" :data-kind="kind">
      <template v-if="!asTable && drawn">
        <p v-if="empty" class="absolute inset-0 flex items-center justify-center text-ink-muted">{{ t('chart.noData') }}</p>
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
        >
          <svg :width="model.width" :height="model.height" role="img" :aria-label="a11y.summary" class="block">
            <g :transform="`translate(${model.margin.left} ${model.margin.top})`">
              <Axis :plot-w="model.plotW" :plot-h="model.plotH" :x="xLabels" :y="yLabels" />

              <template v-for="s in model.series" :key="s.id">
                <g v-if="kind === 'line' || s.overlay" fill="none" stroke-linejoin="round" :data-series="s.id" :data-role="s.role">
                  <template v-if="!s.form && lineForm(s.role).doubled">
                    <path :d="s.path" transform="translate(0 -1.75)" :style="{ stroke: `var(--pico-${s.role})` }" stroke-width="1.5" data-line />
                    <path :d="s.path" transform="translate(0 1.75)" :style="{ stroke: `var(--pico-${s.role})` }" stroke-width="1.5" data-line />
                  </template>
                  <path
                    v-else
                    :d="s.path"
                    :style="{ stroke: s.form?.color ?? `var(--pico-${s.role})`, strokeDasharray: s.form?.dash ?? lineForm(s.role).dash, strokeLinecap: s.form ? 'butt' : lineForm(s.role).cap, strokeWidth: 'var(--pico-line-width)' }"
                    data-line
                  />
                </g>
                <g v-else :data-series="s.id" :data-role="s.role">
                  <rect
                    v-for="b in s.bars"
                    :key="b.date"
                    :x="b.x"
                    :y="b.y"
                    :width="b.w"
                    :height="b.h"
                    :fill="b.date === peak ? 'var(--pico-ink)' : roleFill(s.role)"
                    :style="{ stroke: b.date === peak ? 'var(--pico-ink)' : `var(--pico-${s.role})` }"
                    stroke-width="0.5"
                    :data-peak="b.date === peak ? '' : undefined"
                    data-bar
                  />
                </g>
              </template>

              <!-- direct labels at the line ends: mark + name on plain ground, never colour alone -->
              <g v-for="s in model.series.filter((m) => m.end)" :key="`l${s.id}`" :data-end-label="s.id">
                <path
                  :d="`M${s.end!.x} ${s.end!.y} L${model.plotW + 6} ${s.end!.labelY}`"
                  fill="none"
                  :style="{ stroke: 'var(--pico-line-strong)' }"
                  stroke-width="1"
                  aria-hidden="true"
                />
                <RoleMark :role="s.form?.shape ?? s.role" :color="s.form?.color" :x="model.plotW + 14" :y="s.end!.labelY" :size="markPx" />
                <text :x="model.plotW + 14 + markPx" :y="s.end!.labelY" dominant-baseline="central" :style="{ fill: 'var(--pico-ink)', fontSize: 'var(--pico-text-xs)' }">{{ s.label }}</text>
              </g>

              <rect v-if="zoom.brushRect.value" :x="zoom.brushRect.value.x" y="0" :width="zoom.brushRect.value.w" :height="model.plotH" :style="{ fill: 'var(--pico-primary)' }" fill-opacity="0.18" aria-hidden="true" data-brush />

              <!-- crosshair and the mark of every series at the focused date -->
              <g v-if="focusDate" aria-hidden="true" data-crosshair>
                <line :x1="focusX" :x2="focusX" :y1="0" :y2="model.plotH" :style="{ stroke: 'var(--pico-ink)' }" stroke-width="1" stroke-dasharray="2 3" />
                <template v-for="v in focusValues" :key="v.id">
                  <RoleMark v-if="v.value !== null" :role="v.form?.shape ?? v.role" :color="v.form?.color" :x="focusX" :y="model.y(v.value)" :size="markPx + 4" />
                </template>
              </g>
            </g>
          </svg>

          <div
            v-if="focusDate"
            class="pointer-events-none absolute top-2 z-10 rounded-sm border border-line-strong bg-surface p-2 text-xs text-ink"
            :style="tipLeft"
            aria-hidden="true"
            data-tooltip
          >
            <p class="num font-strong">{{ fmt.date(focusDate) }}</p>
            <p v-for="v in focusValues" :key="v.id" class="num flex items-center gap-1">
              <StateMark :state="v.form?.shape ?? v.role" :color="v.form?.color" :size="2" />
              <span>{{ v.label }} {{ fmt.nullable(v.value, (n: number) => fmt.num(n)) }}</span>
            </p>
          </div>
        </div>
        <p :id="hintId" class="sr-only">{{ t('chart.hint') }}</p>
        <p role="status" aria-live="polite" class="sr-only" data-testid="chart-live">{{ liveText }}</p>
      </template>
    </div>

    <p v-if="asTable && zoom.zoomed.value" class="mt-2 text-sm text-ink-muted" data-testid="table-zoom-note">{{ t('chart.tableZoomed') }}</p>
    <ChartTable v-if="asTable" :caption="a11y.title" :columns="tableCols" :dates="model.dates" :values="tablePoints" />

    <Button type="button" variant="outline" size="sm" class="mt-3 text-primary-strong" :aria-pressed="asTable" @click="asTable = !asTable">
      <component :is="asTable ? LineChart : Table2" aria-hidden="true" />{{ asTable ? t('chart.graph') : t('chart.table') }}
    </Button>
    <ZoomControls v-if="!asTable" :zoom="zoom" :range="zoom.range.value" />
  </figure>
</template>

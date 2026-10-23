<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import StateMark from '../StateMark.vue'
import Axis from './Axis.vue'
import ChartTable from './ChartTable.vue'
import { buildModel } from './core/model'
import { lineForm, weaveFill } from './core/roles'
import { useChartSize, useMarkSize } from './core/useChartSize'
import { useChartFocus } from './core/useFocus'
import RoleMark from './RoleMark.vue'
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

const model = computed(() => buildModel({ series: props.series, kind: props.kind, overlay: props.overlay, range: props.range, width: width.value, height: props.height }))
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
const { onKey, onFocus, onBlur, onPointer, onLeave } = focus

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
</script>

<template>
  <figure class="m-0" data-chart="timeseries">
    <figcaption class="mb-3 font-display text-md font-heading text-indigo">{{ a11y.title }}</figcaption>

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
          class="relative h-full w-full touch-pan-y rounded-sm"
          @keydown="onKey"
          @focus="onFocus"
          @blur="onBlur"
          @pointermove="onPointer"
          @pointerleave="onLeave"
        >
          <svg :width="model.width" :height="model.height" role="img" :aria-label="a11y.summary" class="block">
            <g :transform="`translate(${model.margin.left} ${model.margin.top})`">
              <Axis :plot-w="model.plotW" :plot-h="model.plotH" :x="xLabels" :y="yLabels" />

              <template v-for="s in model.series" :key="s.id">
                <g v-if="kind === 'line' || s.overlay" fill="none" stroke-linejoin="round" :data-series="s.id" :data-role="s.role">
                  <template v-if="lineForm(s.role).doubled">
                    <path :d="s.path" transform="translate(0 -1.75)" :style="{ stroke: `var(--pico-${s.role})` }" stroke-width="1.5" data-line />
                    <path :d="s.path" transform="translate(0 1.75)" :style="{ stroke: `var(--pico-${s.role})` }" stroke-width="1.5" data-line />
                  </template>
                  <path
                    v-else
                    :d="s.path"
                    :style="{ stroke: `var(--pico-${s.role})`, strokeDasharray: lineForm(s.role).dash, strokeLinecap: lineForm(s.role).cap, strokeWidth: 'var(--pico-line-width)' }"
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
                    :fill="b.date === peak ? 'var(--pico-crimson)' : weaveFill(s.role)"
                    :style="{ stroke: b.date === peak ? 'var(--pico-crimson)' : `var(--pico-${s.role})` }"
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
                <RoleMark :role="s.role" :x="model.plotW + 14" :y="s.end!.labelY" :size="markPx" />
                <text :x="model.plotW + 14 + markPx" :y="s.end!.labelY" dominant-baseline="central" :style="{ fill: 'var(--pico-ink)', fontSize: 'var(--pico-text-xs)' }">{{ s.label }}</text>
              </g>

              <!-- crosshair and the mark of every series at the focused date -->
              <g v-if="focusDate" aria-hidden="true" data-crosshair>
                <line :x1="focusX" :x2="focusX" :y1="0" :y2="model.plotH" :style="{ stroke: 'var(--pico-ink)' }" stroke-width="1" stroke-dasharray="2 3" />
                <template v-for="v in focusValues" :key="v.id">
                  <RoleMark v-if="v.value !== null" :role="v.role" :x="focusX" :y="model.y(v.value)" :size="markPx + 4" />
                </template>
              </g>
            </g>
          </svg>

          <div
            v-if="focusDate"
            class="pointer-events-none absolute top-3 z-10 rounded-sm border border-line-strong bg-surface p-3 text-xs text-ink"
            :style="tipLeft"
            aria-hidden="true"
            data-tooltip
          >
            <p class="num font-strong">{{ fmt.date(focusDate) }}</p>
            <p v-for="v in focusValues" :key="v.id" class="num flex items-center gap-2">
              <StateMark :state="v.role" :size="2" />
              <span>{{ v.label }} {{ fmt.nullable(v.value, (n: number) => fmt.num(n)) }}</span>
            </p>
          </div>
        </div>
        <p :id="hintId" class="sr-only">{{ t('chart.hint') }}</p>
        <p role="status" aria-live="polite" class="sr-only" data-testid="chart-live">{{ liveText }}</p>
      </template>
    </div>

    <ChartTable v-if="asTable" :caption="a11y.title" :columns="tableCols" :dates="model.dates" :values="tablePoints" />

    <button
      type="button"
      class="mt-3 inline-flex min-h-touch items-center rounded-sm border border-line-strong bg-surface px-4 text-sm font-strong text-primary-strong"
      @click="asTable = !asTable"
    >
      {{ asTable ? t('chart.graph') : t('chart.table') }}
    </button>
  </figure>
</template>

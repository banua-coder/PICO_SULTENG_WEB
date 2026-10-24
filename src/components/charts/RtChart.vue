<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import Axis from './Axis.vue'
import ChartTable from './ChartTable.vue'
import { buildRtModel } from './core/rtModel'
import { useChartSize, useMarkSize } from './core/useChartSize'
import { useChartFocus } from './core/useFocus'
import RoleMark from './RoleMark.vue'
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

const model = computed(() => buildRtModel({ points: props.points, range: props.range, width: width.value, height: props.height, yMax: props.yMax }))
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
const { onKey, onFocus, onBlur, onPointer, onLeave } = focus
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
const stripe = 'url(#pico-weave-rt)'
</script>

<template>
  <figure class="m-0" data-chart="rt">
    <figcaption class="mb-3 font-display text-md font-heading text-indigo">{{ a11y.title }}</figcaption>

    <div ref="box" :style="{ height: `${height}px` }" class="relative w-full" data-kind="rt">
      <template v-if="!asTable && drawn">
        <p v-if="!model.hasAny" class="absolute inset-0 flex items-center justify-center text-center text-ink-muted" data-testid="rt-empty">{{ t('chart.rtEmpty') }}</p>
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

              <!-- the 95 % band, hatched with the rt weave -->
              <path :d="model.band" :fill="stripe" :style="{ stroke: 'var(--pico-rt)' }" stroke-width="0.5" data-rt-band />
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

              <g v-if="model.end" data-end-label>
                <path :d="`M${model.end.x} ${model.end.y} L${model.plotW + 6} ${model.end.y}`" fill="none" :style="{ stroke: 'var(--pico-line-strong)' }" stroke-width="1" aria-hidden="true" />
                <RoleMark role="rt" :x="model.plotW + 14" :y="model.end.y" :size="markPx" />
                <text :x="model.plotW + 14 + markPx" :y="model.end.y" dominant-baseline="central" :style="{ fill: 'var(--pico-ink)', fontSize: 'var(--pico-text-xs)' }">{{ t('chart.rtEstimate') }}</text>
              </g>

              <g v-if="focusDate" aria-hidden="true" data-crosshair>
                <line :x1="focusX" :x2="focusX" :y1="0" :y2="model.plotH" :style="{ stroke: 'var(--pico-ink)' }" stroke-width="1" stroke-dasharray="2 3" />
                <RoleMark v-if="focusValue" role="rt" :x="focusX" :y="model.y(focusValue.value)" :size="markPx + 4" />
              </g>
            </g>
          </svg>

          <div v-if="focusDate" class="pointer-events-none absolute top-3 z-10 rounded-sm border border-line-strong bg-surface p-3 text-xs text-ink" :style="tipSide" aria-hidden="true" data-tooltip>
            <p class="num font-strong">{{ fmt.date(focusDate) }}</p>
            <p class="num">{{ focusValue ? `Rt ${rt(focusValue.value)} (${rt(focusValue.lo)} – ${rt(focusValue.hi)})` : `Rt ${t('format.notAvailable')}` }}</p>
          </div>
        </div>
        <p :id="hintId" class="sr-only">{{ t('chart.hint') }}</p>
        <p role="status" aria-live="polite" class="sr-only" data-testid="chart-live">{{ liveText }}</p>
      </template>
    </div>

    <p v-if="!asTable && model.hasAny" class="mt-3 text-sm text-ink-muted" data-testid="rt-key">{{ t('chart.rtKey') }}</p>
    <ChartTable v-if="asTable" :caption="a11y.title" :columns="tableCols" :dates="model.dates" :values="tablePoints" :digits="2" />
    <button type="button" class="mt-3 inline-flex min-h-touch items-center rounded-sm border border-line-strong bg-surface px-4 text-sm font-strong text-primary-strong" @click="asTable = !asTable">
      {{ asTable ? t('chart.graph') : t('chart.table') }}
    </button>
  </figure>
</template>

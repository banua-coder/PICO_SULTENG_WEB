<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import StateMark from '../StateMark.vue'
import Axis from './Axis.vue'
import ChartTable from './ChartTable.vue'
import { moveFocus } from './core/keys'
import { buildModel } from './core/model'
import { lineForm, weaveFill } from './core/roles'
import { nearestIndex } from './core/scales'
import { useChartSize, useMarkSize } from './core/useChartSize'
import RoleMark from './RoleMark.vue'
import type { ChartA11y, LineSeries } from './types'

const props = withDefaults(
  defineProps<{
    series: LineSeries[]
    kind: 'line' | 'bar'
    range?: [IsoDate, IsoDate]
    a11y: ChartA11y
    height?: number
  }>(),
  { range: undefined, height: 280 },
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

const model = computed(() => buildModel({ series: props.series, kind: props.kind, range: props.range, width: width.value, height: props.height }))
const drawn = computed(() => width.value > 0)
const empty = computed(() => model.value.dates.length === 0)

const xLabels = computed(() =>
  model.value.xTicks.ticks.map((tk) => ({ pos: tk.pos, label: model.value.xTicks.kind === 'year' ? fmt.year(tk.date) : fmt.month(tk.date) })),
)
const yLabels = computed(() => model.value.yTicks.map((tk) => ({ pos: tk.pos, label: fmt.num(tk.value) })))

// ---- focus: keyboard and pointer share one index into the visible dates ----
const focusIndex = ref<number | null>(null)
const keyboard = ref(false)
const focusDate = computed<IsoDate | null>(() => (focusIndex.value === null ? null : (model.value.dates[focusIndex.value] ?? null)))
watch(focusDate, (d) => emit('focus-date', d))

const focusValues = computed(() => (focusDate.value ? model.value.valuesAt(focusDate.value) : []))
const liveText = computed(() => {
  const d = focusDate.value
  if (!d) return ''
  const values = focusValues.value.map((v) => `${v.label.toLocaleLowerCase(locale.value)} ${fmt.nullable(v.value, (n: number) => fmt.num(n))}`).join(', ')
  return t('chart.focus', { date: fmt.date(d), values })
})

function onKey(e: KeyboardEvent) {
  const n = model.value.dates.length
  if (n === 0) return
  if (e.key === 'Escape') {
    focusIndex.value = null
    return
  }
  const next = moveFocus(e.key, focusIndex.value ?? n - 1, n)
  if (next === null) return
  e.preventDefault()
  keyboard.value = true
  focusIndex.value = next
}
function onFocus() {
  if (focusIndex.value === null && model.value.dates.length) focusIndex.value = model.value.dates.length - 1 // start at the latest date
}
function onBlur() {
  keyboard.value = false
  focusIndex.value = null
}
function onPointer(e: PointerEvent) {
  const el = surface.value
  if (!el || empty.value) return
  const px = e.clientX - el.getBoundingClientRect().left - model.value.margin.left
  if (px < -8 || px > model.value.plotW + 8) return
  focusIndex.value = nearestIndex(model.value.dates, model.value.xInvert(px))
}
function onLeave() {
  if (!keyboard.value) focusIndex.value = null
}

const focusX = computed(() => (focusDate.value ? model.value.x(focusDate.value) : 0))
const tipLeft = computed(() => {
  const x = model.value.margin.left + focusX.value
  return x > model.value.width / 2 ? { right: `${model.value.width - x + 12}px` } : { left: `${x + 12}px` }
})
const hintId = `${uid}-hint`
const tableCols = computed(() => props.series.map((s) => ({ id: s.id, label: s.label })))
const tablePoints = computed(() => model.value.visible)
</script>

<template>
  <figure class="m-0">
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
                <g v-if="kind === 'line'" fill="none" stroke-linejoin="round" :data-series="s.id" :data-role="s.role">
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
                    :fill="weaveFill(s.role)"
                    :style="{ stroke: `var(--pico-${s.role})` }"
                    stroke-width="0.5"
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

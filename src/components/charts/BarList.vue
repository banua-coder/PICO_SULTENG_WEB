<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import { Button } from '@/components/ui/button'
import { BarChart3, Table2 } from '@lucide/vue'
import { buildBars } from './core/barsModel'
import { roleFill } from './core/roles'
import { useChartSize } from './core/useChartSize'
import type { BarDatum, ChartA11y } from './types'

const props = defineProps<{ items: BarDatum[]; orientation: 'horizontal' | 'vertical'; max?: number; a11y: ChartA11y }>()

const { t } = useI18n()
const fmt = useFormat()
const box = ref<HTMLElement>()
const width = useChartSize(box)
const asTable = ref(false)
const model = computed(() => buildBars({ items: props.items, orientation: props.orientation, max: props.max, width: width.value }))
const text = (v: number | null) => fmt.nullable(v, (n: number) => fmt.num(n))
// reserve the height before the width is known, so nothing moves when the chart appears
const reserved = computed(() => (width.value > 0 ? model.value.height : buildBars({ items: props.items, orientation: props.orientation, max: props.max, width: 360 }).height))
</script>

<template>
  <figure class="m-0">
    <figcaption class="mb-2 font-display text-md font-heading text-ink">{{ a11y.title }}</figcaption>
    <div ref="box" class="w-full" :style="{ height: `${reserved}px` }" :data-orientation="orientation">
      <svg v-if="!asTable && width > 0" :width="width" :height="model.height" role="img" :aria-label="a11y.summary" class="block max-w-full">
        <g v-for="b in model.bars" :key="b.key" :data-bar-key="b.key" :data-role="b.role">
          <text :x="b.labelAt.x" :y="b.labelAt.y" :text-anchor="b.labelAt.anchor" dominant-baseline="central" :style="{ fill: 'var(--pico-ink)', fontSize: 'var(--pico-text-sm)' }" data-label>
            <tspan v-for="(line, i) in b.lines" :key="i" :x="b.labelAt.x" :dy="i === 0 ? 0 : 14">{{ line }}</tspan>
          </text>
          <rect v-if="b.rect" :x="b.rect.x" :y="b.rect.y" :width="b.rect.w" :height="b.rect.h" :fill="roleFill(b.role)" :style="{ stroke: `var(--pico-${b.role})` }" stroke-width="1" data-bar data-contrast-alt="value printed next to the bar" />
          <text :x="b.valueAt.x" :y="b.valueAt.y" :text-anchor="b.valueAt.anchor" dominant-baseline="central" class="num" :style="{ fill: 'var(--pico-ink)', fontSize: 'var(--pico-text-sm)' }" data-value>{{ text(b.value) }}</text>
        </g>
      </svg>
      <div v-else-if="asTable" role="region" tabindex="0" :aria-label="a11y.title" class="overflow-auto rounded-lg border bg-card text-card-foreground shadow-card">
        <table class="w-full border-collapse text-sm">
          <caption class="sr-only">{{ a11y.title }}</caption>
          <thead><tr><th scope="col" class="border-b border-line-strong p-2 text-left font-strong">{{ t('map.name') }}</th><th scope="col" class="border-b border-line-strong p-2 text-right font-strong">{{ t('chart.tableValue') }}</th></tr></thead>
          <tbody>
            <tr v-for="i in items" :key="i.key"><th scope="row" class="border-b border-line p-2 text-left font-regular">{{ i.label }}</th><td class="num border-b border-line p-2 text-right" :data-key="i.key">{{ text(i.value) }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <Button type="button" variant="outline" size="sm" class="mt-2 text-primary-strong" :aria-pressed="asTable" @click="asTable = !asTable">
      <component :is="asTable ? BarChart3 : Table2" aria-hidden="true" />{{ asTable ? t('chart.graph') : t('chart.table') }}
    </Button>
  </figure>
</template>

<script setup lang="ts">
// Gridlines and tick labels. Internal to the chart kit.
defineProps<{
  plotW: number
  plotH: number
  x: { pos: number; label: string }[]
  y: { pos: number; label: string }[]
}>()
</script>

<template>
  <g aria-hidden="true" class="chart-axis">
    <g v-for="t in y" :key="`y${t.pos}`">
      <line :x1="0" :x2="plotW" :y1="t.pos" :y2="t.pos" :style="{ stroke: 'var(--pico-line)' }" stroke-width="1" data-contrast-alt="decorative gridline, the values are the axis labels" />
      <text :x="-8" :y="t.pos" text-anchor="end" dominant-baseline="central" class="num" :style="{ fill: 'var(--pico-ink-muted)', fontSize: 'var(--pico-text-xs)' }">{{ t.label }}</text>
    </g>
    <line :x1="0" :x2="plotW" :y1="plotH" :y2="plotH" :style="{ stroke: 'var(--pico-line-strong)' }" stroke-width="1" />
    <g v-for="t in x" :key="`x${t.pos}`">
      <line :x1="t.pos" :x2="t.pos" :y1="plotH" :y2="plotH + 4" :style="{ stroke: 'var(--pico-line-strong)' }" stroke-width="1" />
      <text :x="t.pos" :y="plotH + 18" text-anchor="middle" :style="{ fill: 'var(--pico-ink-muted)', fontSize: 'var(--pico-text-xs)' }">{{ t.label }}</text>
    </g>
  </g>
</template>

<script setup lang="ts">
import type { DataState } from './StateMark.vue'

// The five data-role marks of DESIGN.md on a 24 x 24 box: square, diamond, two bars, triangle, open ring.
// Shared by StateMark (HTML) and the chart kit (SVG, scaled).
defineProps<{ state: DataState }>()
</script>

<template>
  <rect v-if="state === 'positive'" x="3" y="3" width="18" height="18" :style="{ fill: `var(--pico-${state})` }" />
  <path v-else-if="state === 'recovered'" d="M12 1.5 22.5 12 12 22.5 1.5 12Z" :style="{ fill: `var(--pico-${state})` }" />
  <g v-else-if="state === 'deceased'" :style="{ fill: `var(--pico-${state})` }">
    <rect x="3" y="3" width="7" height="18" />
    <rect x="14" y="3" width="7" height="18" />
  </g>
  <path v-else-if="state === 'active'" d="M12 2.5 22 21H2Z" :style="{ fill: `var(--pico-${state})` }" />
  <circle v-else cx="12" cy="12" r="8" fill="none" stroke-width="4" :style="{ stroke: `var(--pico-${state})` }" />
</template>

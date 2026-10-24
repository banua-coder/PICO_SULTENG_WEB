<script setup lang="ts">
import { computed } from 'vue'
import type { DataState } from './StateMark.vue'

// The five data-role marks of DESIGN.md on a 24 x 24 box: square, diamond, two bars, triangle, open ring.
// Shared by StateMark (HTML) and the chart kit (SVG, scaled).
const props = defineProps<{ state: DataState; /** a CSS colour (a token) instead of the role's own */ color?: string }>()
const fill = computed(() => props.color ?? `var(--pico-${props.state})`)
</script>

<template>
  <rect v-if="state === 'positive'" x="3" y="3" width="18" height="18" :style="{ fill }" />
  <path v-else-if="state === 'recovered'" d="M12 1.5 22.5 12 12 22.5 1.5 12Z" :style="{ fill }" />
  <g v-else-if="state === 'deceased'" :style="{ fill }">
    <rect x="3" y="3" width="7" height="18" />
    <rect x="14" y="3" width="7" height="18" />
  </g>
  <path v-else-if="state === 'active'" d="M12 2.5 22 21H2Z" :style="{ fill }" />
  <circle v-else cx="12" cy="12" r="8" fill="none" stroke-width="4" :style="{ stroke: fill }" />
</template>

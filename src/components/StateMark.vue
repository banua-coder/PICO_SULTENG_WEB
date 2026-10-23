<script setup lang="ts">
import { computed } from 'vue'

export type DataState = 'positive' | 'recovered' | 'deceased' | 'active' | 'rt'

const props = withDefaults(defineProps<{ state: DataState; size?: 1 | 2 | 3 | 4 | 5 | 6 }>(), { size: 3 })

// Mark per data role (DESIGN.md): square, diamond, two bars, triangle, open ring. Always sits next to a text label.
const colour = computed(() => `var(--pico-${props.state})`)
const px = computed(() => `var(--pico-mark-${props.size})`)
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    :style="{ width: px, height: px, flex: 'none' }"
    aria-hidden="true"
    focusable="false"
    :data-state="state"
  >
    <rect v-if="state === 'positive'" x="3" y="3" width="18" height="18" :style="{ fill: colour }" />
    <path v-else-if="state === 'recovered'" d="M12 1.5 22.5 12 12 22.5 1.5 12Z" :style="{ fill: colour }" />
    <g v-else-if="state === 'deceased'" :style="{ fill: colour }">
      <rect x="3" y="3" width="7" height="18" />
      <rect x="14" y="3" width="7" height="18" />
    </g>
    <path v-else-if="state === 'active'" d="M12 2.5 22 21H2Z" :style="{ fill: colour }" />
    <circle v-else cx="12" cy="12" r="8" fill="none" stroke-width="4" :style="{ stroke: colour }" />
  </svg>
</template>

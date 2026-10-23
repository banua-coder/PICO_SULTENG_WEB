<script setup lang="ts">
import { computed } from 'vue'
import MarkShape from './MarkShape.vue'

export type DataState = 'positive' | 'recovered' | 'deceased' | 'active' | 'rt'

const props = withDefaults(defineProps<{ state: DataState; size?: 1 | 2 | 3 | 4 | 5 | 6 }>(), { size: 3 })

// Always sits next to a text label. Size is the magnitude ramp --pico-mark-1..6.
const px = computed(() => `var(--pico-mark-${props.size})`)
</script>

<template>
  <svg viewBox="0 0 24 24" :style="{ width: px, height: px, flex: 'none' }" aria-hidden="true" focusable="false" :data-state="state">
    <MarkShape :state="state" />
  </svg>
</template>

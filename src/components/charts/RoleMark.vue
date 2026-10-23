<script setup lang="ts">
import { computed } from 'vue'
import MarkShape from '../MarkShape.vue'
import type { Role } from './types'

// A data-role mark inside a chart's SVG, centred on (x, y) and `size` px wide.
const props = defineProps<{ role: Role; x: number; y: number; size: number }>()
const transform = computed(() => `translate(${props.x - props.size / 2} ${props.y - props.size / 2}) scale(${props.size / 24})`)
</script>

<template>
  <g :transform="transform" :data-mark="role" aria-hidden="true">
    <MarkShape :state="role" />
  </g>
</template>

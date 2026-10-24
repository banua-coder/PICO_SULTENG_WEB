<script setup lang="ts">
import paths from './geo/indonesia.paths.json'
import GeoMap from './GeoMap.vue'
import type { MapItem, MapMetric } from './types'

// The 34 provinces (contract C4). On a narrow screen 34 numbers cannot be read, so the marks give way to the table below.
defineProps<{ items: MapItem[]; metric: MapMetric; selected?: string; hrefFor?: (code: string) => string }>()
defineEmits<{ select: [code: string] }>()
</script>

<template>
  <GeoMap :paths="paths" :view-size="[1000, 420]" :items="items" :metric="metric" :selected="selected" :href-for="hrefFor" :compact-below="560" stacked @select="$emit('select', $event)" />
</template>

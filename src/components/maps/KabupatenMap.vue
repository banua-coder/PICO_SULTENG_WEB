<script setup lang="ts">
import paths from './geo/sulteng.paths.json'
import GeoMap from './GeoMap.vue'
import type { MapItem, MapMetric } from './types'

// The 13 kabupaten/kota of Sulawesi Tengah (contract C4).
defineProps<{ items: MapItem[]; metric: MapMetric; selected?: string; hrefFor?: (code: string) => string }>()
defineEmits<{ select: [code: string] }>()
</script>

<template>
  <GeoMap :paths="paths" :view-size="[800, 600]" :items="items" :metric="metric" :selected="selected" :href-for="hrefFor" @select="$emit('select', $event)" />
</template>

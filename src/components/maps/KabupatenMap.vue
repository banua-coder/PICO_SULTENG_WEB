<script setup lang="ts">
import paths from './geo/sulteng.paths.json'
import GeoMap from './GeoMap.vue'
import type { MapProps } from './types'

// The 13 kabupaten/kota of Sulawesi Tengah (contract C4).
defineProps<MapProps>()
defineEmits<{ select: [code: string] }>()
</script>

<template>
  <GeoMap :paths="paths" :view-size="[800, 600]" v-bind="$props" @select="$emit('select', $event)" />
</template>

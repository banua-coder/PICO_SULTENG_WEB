<script setup lang="ts">
import defs from '@/assets/brand/patterns/pico-weave-defs.svg?raw'
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- trusted brand SVG: the <pattern> fills every chart uses -->
  <div aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden" v-html="defs" />
</template>

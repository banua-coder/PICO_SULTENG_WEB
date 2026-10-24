<script setup lang="ts">
import PicoIcon from './PicoIcon.vue'

// A prominent, calm notice that a page holds records from the pandemic and can be out of date. Border and icon, not red.
</script>

<template>
  <aside role="note" class="flex gap-3 rounded-md border-2 border-indigo bg-tint p-5 text-ink" data-testid="archive-notice">
    <PicoIcon name="info" :size="24" class="mt-1 flex-none text-indigo" />
    <div class="flex flex-col gap-2"><slot /></div>
  </aside>
</template>

<script setup lang="ts">
import PicoIcon from './PicoIcon.vue'

// A prominent, calm notice that a page holds records from the pandemic and can be out of date. Border and icon, not red.
</script>

<template>
  <aside role="note" class="flex gap-2 rounded-md border-2 border-indigo bg-tint p-4 text-ink" data-testid="archive-notice">
    <PicoIcon name="info" :size="24" class="mt-0.5 flex-none text-indigo" />
    <div class="flex flex-col gap-1"><slot /></div>
  </aside>
</template>

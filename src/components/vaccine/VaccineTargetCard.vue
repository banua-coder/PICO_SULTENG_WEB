<script setup lang="ts">
import { useFormat } from '@/app/useFormat'

// The owner's CardVaccineTarget: the target figure in the group colour, big and centred, with its label under it.
defineProps<{ target: number; label: string; group: string }>()
const f = useFormat()
</script>

<template>
  <div class="w-full rounded-lg bg-card p-4 text-center text-ink shadow-lg" data-testid="vaccine-target">
    <p class="num m-0 text-[3rem] leading-none font-semibold md:text-[4.5rem]" :style="{ color: `var(--pico-vg-${group}-ink)` }">{{ f.num(target) }}</p>
    <p class="m-0 mt-4 text-sm md:text-[1.25rem]">{{ label }}</p>
  </div>
</template>

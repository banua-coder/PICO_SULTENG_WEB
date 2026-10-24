<script setup lang="ts">
import type { IconKey } from '@/assets/brand/icon-keys'
import PicoIcon from './PicoIcon.vue'
import { Card } from '@/components/ui/card'

// A prevention tip: the old PICO picture (or a brand icon) with a visible caption. The picture is decoration; the caption carries the meaning.
defineProps<{ caption: string; src?: string; icon?: IconKey }>()
</script>

<template>
  <figure class="m-0">
    <Card class="h-full items-center gap-2 p-4 text-center">
      <img v-if="src" :src="src" alt="" width="87" height="78" loading="lazy" decoding="async" class="h-20 w-auto">
      <PicoIcon v-else-if="icon" :name="icon" :size="24" class="size-16 text-active" />
      <figcaption class="text-sm">{{ caption }}</figcaption>
    </Card>
  </figure>
</template>

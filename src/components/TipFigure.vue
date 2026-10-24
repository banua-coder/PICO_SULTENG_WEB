<script setup lang="ts">
import type { IconKey } from '@/assets/brand/icon-keys'
import Illustration from './Illustration.vue'
import PicoIcon from './PicoIcon.vue'
import { Card } from '@/components/ui/card'

// A prevention tip: the old PICO picture (or a brand icon) with a visible caption. The picture is decoration; the caption carries the meaning.
defineProps<{ caption: string; src?: string; icon?: IconKey; /** a brand v2 illustration (public/illustrations) */ illustration?: string }>()
</script>

<template>
  <figure class="m-0">
    <Card class="h-full items-center gap-2 p-4 text-center">
      <Illustration v-if="illustration" :name="illustration" :width="120" />
      <img v-else-if="src" :src="src" alt="" width="87" height="78" loading="lazy" decoding="async" class="h-20 w-auto">
      <PicoIcon v-else-if="icon" :name="icon" :size="24" class="size-16 text-active" />
      <figcaption class="text-sm">{{ caption }}</figcaption>
    </Card>
  </figure>
</template>

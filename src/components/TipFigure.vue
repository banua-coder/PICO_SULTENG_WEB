<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { IconKey } from '@/assets/brand/icon-keys'
import Illustration from './Illustration.vue'
const LottieMoment = defineAsyncComponent(() => import('./LottieMoment.vue')) // its own chunk: only the Wiki hand-washing tip plays
import PicoIcon from './PicoIcon.vue'
import { Card } from '@/components/ui/card'

// A prevention tip: the old PICO picture (or a brand icon) with a visible caption. The picture is decoration; the caption carries the meaning.
defineProps<{ caption: string; src?: string; icon?: IconKey; /** a brand v2 illustration (public/illustrations) */ illustration?: string; /** the hand-washing Lottie (poster first, still under reduced motion) instead of the still picture */ lottie?: 'handwash-loop' }>()
</script>

<template>
  <figure class="m-0">
    <Card class="h-full items-center gap-2 p-4 text-center">
      <LottieMoment v-if="lottie" :name="lottie" :width="120" />
      <Illustration v-else-if="illustration" :name="illustration" :width="120" />
      <img v-else-if="src" :src="src" alt="" width="87" height="78" loading="lazy" decoding="async" class="h-20 w-auto">
      <PicoIcon v-else-if="icon" :name="icon" :size="24" class="size-16 text-active" />
      <figcaption class="text-sm">{{ caption }}</figcaption>
    </Card>
  </figure>
</template>

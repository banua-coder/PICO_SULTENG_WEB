<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import type { Infographic } from '@/api/types'
import PicoImage from '@/components/PicoImage.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

// A shadcn Dialog (reka-ui): it traps focus, makes the page behind inert, closes on Escape and returns focus to the opener.
// We add the image index, arrow keys and swipe.
const props = defineProps<{ item: Infographic | null }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const index = ref(0)
const n = computed(() => props.item?.images.length ?? 0)
watch(() => props.item?.id, () => (index.value = 0))

const go = (d: number) => {
  if (n.value) index.value = (index.value + d + n.value) % n.value
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
}
let startX: number | null = null
const down = (e: PointerEvent) => (startX = e.clientX)
function up(e: PointerEvent) {
  if (startX !== null && Math.abs(e.clientX - startX) > 50) go(e.clientX < startX ? 1 : -1)
  startX = null
}
</script>

<template>
  <Dialog :open="item !== null" @update:open="(o) => !o && emit('close')">
    <DialogContent class="max-h-[95dvh] w-[min(94vw,30rem)] overflow-y-auto" :aria-describedby="undefined" @keydown="onKey">
      <template v-if="item">
        <DialogTitle class="pr-6 text-lg">{{ item.title }}</DialogTitle>
        <DialogDescription class="sr-only">{{ t('infografis.viewer') }}</DialogDescription>
        <div v-if="n" class="touch-pan-y" @pointerdown="down" @pointerup="up" @pointercancel="startX = null">
          <PicoImage :key="`${item.id}-${index}`" :src="item.images[index]!" :alt="t('infografis.imageAlt', { title: item.title, n: index + 1, m: n })" ratio="4/5" fit="contain" loading="eager" retryable />
        </div>
        <p v-else class="m-0 text-ink-muted">{{ t('infografis.noImages') }}</p>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div v-if="n > 1" class="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" :aria-label="t('infografis.prevLabel')" @click="go(-1)"><ChevronLeft aria-hidden="true" /></Button>
            <span role="status" aria-live="polite" class="num text-sm">{{ t('infografis.position', { n: index + 1, m: n }) }}</span>
            <Button type="button" variant="outline" size="icon" :aria-label="t('infografis.nextLabel')" @click="go(1)"><ChevronRight aria-hidden="true" /></Button>
          </div>
          <a v-if="item.source" :href="item.source" rel="noopener noreferrer" target="_blank">{{ t('infografis.source') }}</a>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>

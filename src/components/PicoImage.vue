<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ImageOff } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = withDefaults(
  defineProps<{
    src: string | null
    alt: string
    ratio: '16/9' | '4/5' | '1/1'
    fallback?: 'plate' | 'initials'
    loading?: 'lazy' | 'eager'
    /** After a failed load, say so and offer a retry button inside the same box */
    retryable?: boolean
    /** 'contain' shows the whole picture (a viewer), 'cover' fills the box (a card) */
    fit?: 'cover' | 'contain'
  }>(),
  { fallback: 'plate', loading: 'lazy', retryable: false, fit: 'cover' },
)

const { t } = useI18n()
const failed = ref(false)
const attempt = ref(0)
function retry() {
  failed.value = false
  attempt.value++ // a new <img> element: the browser tries the address again
}
const img = ref<HTMLImageElement>()
const shown = computed(() => !!props.src && !failed.value)
const initials = computed(() =>
  props.alt
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => [...w][0]!.toUpperCase())
    .join(''),
)

watch(() => props.src, () => (failed.value = false))
// the error event can fire before hydration attaches the listener, so check once after mount
onMounted(() => {
  const el = img.value
  if (el && el.complete && el.naturalWidth === 0) failed.value = true
})
</script>

<template>
  <!-- The box has its own fixed ratio, so a missing image never shifts the layout (CLS 0). -->
  <div class="relative w-full overflow-hidden rounded-md bg-cotton-deep" :style="{ aspectRatio: ratio }">
    <img
      v-if="shown"
      :key="attempt"
      ref="img"
      :src="src!"
      :alt="alt"
      :loading="loading"
      decoding="async"
      draggable="false"
      referrerpolicy="no-referrer"
      :class="['absolute inset-0 size-full', fit === 'contain' ? 'object-contain' : 'object-cover']"
      @error="failed = true"
    >
    <div v-else-if="fallback === 'initials' && initials" role="img" :aria-label="alt" class="absolute inset-0 flex items-center justify-center" data-placeholder="initials">
      <span aria-hidden="true" class="flex size-8 items-center justify-center rounded-full border border-line-strong bg-surface font-display text-lg font-heading text-primary-strong">{{ initials }}</span>
    </div>
    <div v-else role="img" :aria-label="`${alt}. ${t('image.missing')}`" class="absolute inset-0 flex items-center justify-center" data-placeholder="plate">
      <ImageOff class="size-10 text-ink-muted" aria-hidden="true" />
    </div>
    <div v-if="failed && retryable" class="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-surface p-2 text-center text-xs" data-failed>
      <span class="text-ink">{{ t('image.failed') }}</span>
      <Button type="button" variant="outline" size="sm" @click="retry">{{ t('image.retry') }}</Button>
    </div>
  </div>
</template>

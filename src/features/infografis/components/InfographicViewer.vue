<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Infographic } from '@/api/types'
import PicoImage from '@/components/PicoImage.vue'

// A native <dialog>: the browser traps focus, makes the page behind inert and closes on Escape. We only add the
// image index, arrow keys, swipe and the focus return for the case where the dialog opened from the address (no trigger).
const props = defineProps<{ item: Infographic | null }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const dialog = ref<HTMLDialogElement>()
const index = ref(0)
const n = computed(() => props.item?.images.length ?? 0)
let trigger: HTMLElement | null = null

function sync() {
  const el = dialog.value
  if (!el) return
  if (props.item && !el.open) {
    trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (typeof el.showModal === 'function') el.showModal()
    else el.setAttribute('open', '')
  } else if (!props.item && el.open) {
    el.close?.()
    el.removeAttribute('open')
    trigger?.focus()
    trigger = null
  }
}
watch(() => props.item?.id, () => (index.value = 0))
watch(() => props.item, sync, { flush: 'post' })
onMounted(sync) // an item that is already there at mount (?id with the list in the cache)
onBeforeUnmount(() => dialog.value?.close?.())

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
const btn = 'min-h-touch min-w-touch rounded-sm border border-line-strong bg-surface px-4 text-sm font-strong text-primary-strong'
</script>

<template>
  <dialog
    ref="dialog"
    :aria-label="item ? item.title : t('infografis.viewer')"
    class="m-auto w-[min(94vw,30rem)] rounded-md border border-line bg-surface p-5 text-ink"
    @close="item && emit('close')"
    @keydown="onKey"
  >
    <div v-if="item" class="flex flex-col gap-4">
      <div class="flex items-start justify-between gap-3">
        <h2 class="text-lg">{{ item.title }}</h2>
        <button type="button" :class="btn" @click="emit('close')">{{ t('infografis.close') }}</button>
      </div>
      <div v-if="n" class="touch-pan-y" @pointerdown="down" @pointerup="up" @pointercancel="startX = null">
        <PicoImage :key="`${item.id}-${index}`" :src="item.images[index]!" :alt="t('infografis.imageAlt', { title: item.title, n: index + 1, m: n })" ratio="4/5" fit="contain" loading="eager" retryable />
      </div>
      <p v-else class="m-0 text-ink-muted">{{ t('infografis.noImages') }}</p>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div v-if="n > 1" class="flex items-center gap-3">
          <button type="button" :class="btn" @click="go(-1)">{{ t('infografis.prev') }}</button>
          <span role="status" aria-live="polite" class="text-sm tabular-nums">{{ t('infografis.position', { n: index + 1, m: n }) }}</span>
          <button type="button" :class="btn" @click="go(1)">{{ t('infografis.next') }}</button>
        </div>
        <a v-if="item.source" :href="item.source" rel="noopener noreferrer" target="_blank">{{ t('infografis.source') }}</a>
      </div>
    </div>
  </dialog>
</template>

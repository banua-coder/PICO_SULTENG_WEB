<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { AnimationItem } from 'lottie-web'
import { useReducedMotion } from './useReducedMotion'

// A brand v2 Lottie moment. The SVG poster (light and dark) is what is in the page and what stays under reduced motion. The player and the
// JSON are fetched only after mount, only when the element is in view, and never when the visitor asked for reduced motion.
// ponytail: a theme switch while it plays is not followed (the next play uses the new theme); the poster follows at once.
const props = withDefaults(defineProps<{ name: 'loading' | 'success' | 'offline' | 'empty' | 'handwash-loop' | 'logo-reveal'; alt?: string; width?: number; loop?: boolean }>(), {
  alt: '',
  width: 160,
  loop: undefined,
})
const LOOPS = new Set(['loading', 'handwash-loop'])
const root = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const playing = ref(false)
const reduced = useReducedMotion()
let anim: AnimationItem | undefined
let observer: IntersectionObserver | undefined
let gone = false

const isDark = () => {
  const t = document.documentElement.dataset.theme
  return t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
}
function stop() {
  anim?.destroy()
  anim = undefined
  playing.value = false
}
async function start() {
  if (anim || gone || reduced.value || !stage.value) return
  try {
    const { play } = await import('./lottie/player')
    const a = await play({ container: stage.value, name: props.name, dark: isDark(), loop: props.loop ?? LOOPS.has(props.name) })
    if (gone || reduced.value) return a.destroy()
    anim = a
    playing.value = true
  } catch {
    stop() // the poster stays: a missing file or player is not an error for the visitor
  }
}
onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return void start()
  observer = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && (observer?.disconnect(), void start()))
  observer.observe(root.value!)
})
watch(reduced, (r) => r && stop())
onBeforeUnmount(() => {
  gone = true
  observer?.disconnect()
  stop()
})
</script>

<template>
  <span ref="root" class="pico-ill inline-block" :style="{ width: `${width}px`, maxWidth: '100%' }" :role="alt ? 'img' : undefined" :aria-label="alt || undefined" :aria-hidden="alt ? undefined : 'true'" data-lottie>
    <span ref="stage" class="block w-full" :class="playing ? '' : 'hidden'" data-lottie-stage />
    <span v-show="!playing" class="block">
      <img :src="`/lottie/posters/${name}.svg`" alt="" width="200" height="200" loading="lazy" decoding="async" class="pico-ill-light h-auto w-full">
      <img :src="`/lottie/posters/${name}-dark.svg`" alt="" width="200" height="200" loading="lazy" decoding="async" class="pico-ill-dark h-auto w-full">
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { recolor } from './lottie'
import { useReducedMotion } from './useReducedMotion'

export type LottieName = 'loading' | 'success' | 'error' | 'no-internet' | 'vaccinated' | 'logo-reveal'

const props = defineProps<{ name: LottieName; loop?: boolean; label: string }>()

const staticSvgs = import.meta.glob<string>('@/assets/brand/lottie/static/*.svg', { query: '?raw', import: 'default', eager: true })
const animations = import.meta.glob<{ default: object }>('@/assets/brand/lottie/*.json')
const find = <T,>(files: Record<string, T>) => Object.entries(files).find(([p]) => p.endsWith(`pico-${props.name}.${p.split('.').pop()}`))?.[1]

const staticSvg = computed(() => find(staticSvgs) ?? '')
const reduced = useReducedMotion()
const box = ref<HTMLElement>()
const live = ref(false) // an animation is on screen, so the static drawing hides
let player: { destroy: () => void } | undefined
let observer: MutationObserver | undefined
let run = 0

function stop() {
  player?.destroy()
  player = undefined
  live.value = false
}

async function start() {
  stop()
  // With reduced motion the player is never requested: the static SVG stays.
  if (reduced.value || !box.value) return
  const mine = ++run
  const [{ default: lottie }, loader] = [await import('lottie-web/build/player/lottie_light'), find(animations)]
  if (!loader || mine !== run || reduced.value || !box.value) return
  const data = structuredClone((await loader()).default)
  const css = getComputedStyle(document.documentElement)
  recolor(data, (n) => css.getPropertyValue(n))
  if (mine !== run || !box.value) return
  box.value.querySelector('[data-lottie]')?.replaceChildren()
  player = lottie.loadAnimation({
    container: box.value.querySelector('[data-lottie]') as HTMLElement,
    renderer: 'svg',
    loop: props.loop ?? props.name === 'loading',
    autoplay: true,
    animationData: data,
  })
  live.value = true
}

// a player that fails to load leaves the static SVG in place: never an unhandled error
const safeStart = () => void start().catch(() => (live.value = false))

onMounted(() => {
  safeStart()
  // light and dark switch by data-theme or by the system: rebuild with the new token values
  observer = new MutationObserver(safeStart)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
watch(reduced, safeStart)
watch(() => props.name, safeStart)
onBeforeUnmount(() => {
  run++
  observer?.disconnect()
  stop()
})
</script>

<template>
  <div ref="box" role="img" :aria-label="label" class="relative" style="width: 120px; height: 120px">
    <!-- eslint-disable-next-line vue/no-v-html -- trusted brand SVG: the reduced-motion and prerender drawing -->
    <div v-show="!live" class="size-full" aria-hidden="true" v-html="staticSvg" />
    <div v-show="live" data-lottie class="size-full" aria-hidden="true" />
  </div>
</template>

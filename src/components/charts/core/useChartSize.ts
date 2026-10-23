import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'

/** Width of an element, following resizes. 0 during prerender, so the SVG is never drawn at a made-up width. */
export function useChartSize(el: Ref<HTMLElement | undefined>) {
  const width = ref(0)
  let ro: ResizeObserver | undefined
  onMounted(() => {
    if (!el.value) return
    width.value = Math.round(el.value.getBoundingClientRect().width)
    if (typeof ResizeObserver === 'undefined') return
    ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0)
      if (w !== width.value) width.value = w
    })
    ro.observe(el.value)
  })
  onBeforeUnmount(() => ro?.disconnect())
  return width
}

/** Pixel size of a step of the magnitude ramp (--pico-mark-1..6), read from the tokens after mount. */
export function useMarkSize(step: 1 | 2 | 3 | 4 | 5 | 6) {
  const px = ref(8)
  onMounted(() => {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--pico-mark-${step}`))
    if (Number.isFinite(v) && v > 0) px.value = v
  })
  return px
}

/** The six steps of the magnitude ramp (--pico-mark-1..6) in px, read from the tokens after mount. */
export function useMarkRamp() {
  const ramp = ref<number[]>([4, 6, 8, 11, 16, 23])
  onMounted(() => {
    const css = getComputedStyle(document.documentElement)
    const read = [1, 2, 3, 4, 5, 6].map((i) => parseFloat(css.getPropertyValue(`--pico-mark-${i}`)))
    if (read.every((n) => Number.isFinite(n) && n > 0)) ramp.value = read
  })
  return ramp
}

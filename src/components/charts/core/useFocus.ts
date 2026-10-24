import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { IsoDate } from '@/api/types'
import { moveFocus } from './keys'
import { nearestIndex } from './scales'

/**
 * Keyboard and pointer focus of a time chart: one index into the visible dates, shared by both inputs.
 * Arrows move one date, Page Up and Page Down 30, Home and End the ends, Escape clears. Focusing starts at the latest date.
 */
export function useChartFocus(opts: {
  dates: ComputedRef<IsoDate[]>
  surface: Ref<HTMLElement | undefined>
  /** px inside the plot to a day number */
  xInvert: (px: number) => number
  marginLeft: () => number
  plotW: () => number
  onChange: (date: IsoDate | null) => void
}) {
  const index = ref<number | null>(null)
  const keyboard = ref(false)
  const date = computed<IsoDate | null>(() => (index.value === null ? null : (opts.dates.value[index.value] ?? null)))
  watch(date, (d) => opts.onChange(d))

  const onKey = (e: KeyboardEvent) => {
    const n = opts.dates.value.length
    if (n === 0) return
    if (e.key === 'Escape') {
      index.value = null
      return
    }
    const next = moveFocus(e.key, index.value ?? n - 1, n)
    if (next === null) return
    e.preventDefault()
    keyboard.value = true
    index.value = next
  }
  const onFocus = () => {
    if (index.value === null && opts.dates.value.length) index.value = opts.dates.value.length - 1
  }
  const onBlur = () => {
    keyboard.value = false
    index.value = null
  }
  const onPointer = (e: PointerEvent) => {
    const el = opts.surface.value
    if (!el || opts.dates.value.length === 0) return
    const px = e.clientX - el.getBoundingClientRect().left - opts.marginLeft()
    if (px < -8 || px > opts.plotW() + 8) return
    index.value = nearestIndex(opts.dates.value, opts.xInvert(px))
  }
  const onLeave = () => {
    if (!keyboard.value) index.value = null
  }
  return { index, date, onKey, onFocus, onBlur, onPointer, onLeave }
}

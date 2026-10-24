import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { IsoDate } from '@/api/types'
import { dayNumber, isoFromDay } from './days'
import { brushToRange, panBy, sameRange, zoomAround } from './zoom'
import type { DayRange } from './zoom'

/** Dates a chart draws, first and last of the points (the fallback when the page gives no range). */
export const extentOf = (xs: IsoDate[]): [IsoDate, IsoDate] | undefined => {
  if (!xs.length) return undefined
  let a = xs[0]!
  let b = a
  for (const x of xs) {
    if (x < a) a = x
    if (x > b) b = x
  }
  return [a, b]
}

/**
 * Zoom state of a time chart: a view range inside `full` (the range the page asked for). A new `full` (presets, calendar) resets it.
 * Inputs: drag = brush a range, Shift + drag = pan, Ctrl/Cmd + wheel and two-finger pinch = zoom at the pointer,
 * keys + - 0 and Shift + arrows. The buttons and the slider call the same actions.
 */
export function useZoom(opts: {
  full: ComputedRef<[IsoDate, IsoDate] | undefined>
  surface: Ref<HTMLElement | undefined>
  marginLeft: () => number
  plotW: () => number
  /** px inside the plot to a day number (of the current model) */
  xInvert: (px: number) => number
}) {
  const view = ref<DayRange | null>(null)
  const bounds = computed<DayRange | null>(() => (opts.full.value ? [dayNumber(opts.full.value[0]), dayNumber(opts.full.value[1])] : null))
  watch(() => opts.full.value?.join('|'), () => (view.value = null))

  const current = computed<DayRange | null>(() => view.value ?? bounds.value)
  const range = computed<[IsoDate, IsoDate] | undefined>(() => (current.value ? [isoFromDay(current.value[0]), isoFromDay(current.value[1])] : undefined))
  const zoomed = computed(() => !!view.value && !!bounds.value && !sameRange(view.value, bounds.value))
  const canIn = computed(() => !!current.value && current.value[1] - current.value[0] > 3)
  const canOut = computed(() => zoomed.value)
  const span = computed(() => (current.value ? current.value[1] - current.value[0] : 0))
  /** days between the start of the bounds and the start of the view, for the slider */
  const offset = computed(() => (current.value && bounds.value ? current.value[0] - bounds.value[0] : 0))
  const maxOffset = computed(() => (bounds.value && current.value ? bounds.value[1] - bounds.value[0] - span.value : 0))

  const set = (r: DayRange) => {
    const b = bounds.value
    view.value = b && sameRange(r, b) ? null : r
  }
  const reset = () => (view.value = null)
  const zoomBy = (factor: number, focus?: number) => {
    const c = current.value
    const b = bounds.value
    if (c && b) set(zoomAround(c, b, focus ?? (c[0] + c[1]) / 2, factor))
  }
  const pan = (days: number) => {
    const c = current.value
    const b = bounds.value
    if (c && b) set(panBy(c, b, days))
  }
  const setOffset = (n: number) => pan(n - offset.value)
  const zoomIn = () => zoomBy(0.5)
  const zoomOut = () => zoomBy(2)

  // ---- pointer ----
  const brush = ref<{ x0: number; x1: number } | null>(null)
  let mode: 'brush' | 'pan' | null = null
  let panFrom: DayRange | null = null
  let downX = 0
  const touches = new Map<number, { x: number; y: number }>()
  let pinchDist = 0
  const plotPx = (e: { clientX: number }) => {
    const el = opts.surface.value
    return el ? Math.min(Math.max(e.clientX - el.getBoundingClientRect().left - opts.marginLeft(), 0), opts.plotW()) : 0
  }

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.size === 2) pinchDist = dist()
      return
    }
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
    downX = plotPx(e)
    if (e.shiftKey && zoomed.value) {
      mode = 'pan'
      panFrom = current.value
    } else {
      mode = 'brush'
      brush.value = { x0: downX, x1: downX }
    }
  }
  const dist = () => {
    const [a, b] = [...touches.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      if (!touches.has(e.pointerId)) return
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.size === 2 && pinchDist > 0) {
        const d = dist()
        const mid = [...touches.values()].reduce((s, p) => s + p.x, 0) / 2
        if (d > 0) zoomBy(pinchDist / d, opts.xInvert(plotPx({ clientX: mid })))
        pinchDist = d
      }
      return
    }
    if (mode === 'brush' && brush.value) brush.value = { x0: brush.value.x0, x1: plotPx(e) }
    else if (mode === 'pan' && panFrom && bounds.value) {
      const days = ((downX - plotPx(e)) / Math.max(1, opts.plotW())) * (panFrom[1] - panFrom[0])
      set(panBy(panFrom, bounds.value, days))
    }
  }
  const onUp = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      touches.delete(e.pointerId)
      pinchDist = 0
      return
    }
    if (mode === 'brush' && brush.value && current.value && bounds.value) {
      const r = brushToRange(brush.value.x0, brush.value.x1, opts.plotW(), current.value, bounds.value)
      if (r) set(r)
    }
    mode = null
    panFrom = null
    brush.value = null
  }
  const onWheel = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return // a plain wheel keeps scrolling the page
    e.preventDefault()
    zoomBy(Math.exp(Math.max(-600, Math.min(600, e.deltaY)) * 0.002), opts.xInvert(plotPx(e)))
  }
  /** + - 0 and Shift + arrows. True when the key was used. */
  const onKey = (e: KeyboardEvent): boolean => {
    if (e.ctrlKey || e.metaKey || e.altKey) return false
    const k = e.key
    if (k === '+' || k === '=') zoomIn()
    else if (k === '-' || k === '_') zoomOut()
    else if (k === '0') reset()
    else if (e.shiftKey && (k === 'ArrowLeft' || k === 'ArrowRight')) pan((k === 'ArrowLeft' ? -0.25 : 0.25) * span.value)
    else return false
    e.preventDefault()
    return true
  }
  const brushRect = computed(() => (brush.value && Math.abs(brush.value.x1 - brush.value.x0) >= 4 ? { x: Math.min(brush.value.x0, brush.value.x1), w: Math.abs(brush.value.x1 - brush.value.x0) } : null))

  return { range, zoomed, canIn, canOut, span, offset, maxOffset, zoomIn, zoomOut, reset, pan, setOffset, brushRect, onDown, onMove, onUp, onWheel, onKey }
}

export type Zoom = ReturnType<typeof useZoom>

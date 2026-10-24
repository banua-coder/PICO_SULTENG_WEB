/**
 * Pure zoom maths on day numbers (see days.ts). The view is a [from, to] range inside fixed bounds.
 * ponytail: d3-zoom / d3-brush were not used. They pull d3-selection, d3-transition, d3-drag and d3-interpolate
 * (about 15 kB gzip) for what these four functions and the pointer handlers of useZoom do.
 */
export type DayRange = [number, number]
export const MIN_SPAN = 3

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)

/** Whole days, at least MIN_SPAN wide (or the bounds when those are narrower), moved inside the bounds. */
export function clampRange(r: DayRange, bounds: DayRange): DayRange {
  const span = Math.min(Math.max(Math.round(r[1] - r[0]), MIN_SPAN), bounds[1] - bounds[0])
  const a = clamp(Math.round(r[0]), bounds[0], bounds[1] - span)
  return [a, a + span]
}

/** Scale the span by `factor` (< 1 zooms in) keeping the day under `focus` at the same place on screen. */
export function zoomAround(r: DayRange, bounds: DayRange, focus: number, factor: number): DayRange {
  const span = r[1] - r[0]
  const f = span === 0 ? 0.5 : (focus - r[0]) / span
  const next = span * factor
  const a = focus - f * next
  return clampRange([a, a + next], bounds)
}

export const panBy = (r: DayRange, bounds: DayRange, days: number): DayRange => clampRange([r[0] + days, r[1] + days], bounds)

/** A drag from px x0 to x1 over a plot `plotW` wide showing `r`. Null for a click (under 4 px) or under MIN_SPAN days. */
export function brushToRange(x0: number, x1: number, plotW: number, r: DayRange, bounds: DayRange): DayRange | null {
  const lo = Math.min(x0, x1)
  const hi = Math.max(x0, x1)
  if (hi - lo < 4 || plotW <= 0) return null
  const day = (x: number) => r[0] + (clamp(x, 0, plotW) / plotW) * (r[1] - r[0])
  const a = Math.round(day(lo))
  const b = Math.round(day(hi))
  return b - a < MIN_SPAN ? null : clampRange([a, b], bounds)
}

export const sameRange = (a: DayRange, b: DayRange) => a[0] === b[0] && a[1] === b[1]

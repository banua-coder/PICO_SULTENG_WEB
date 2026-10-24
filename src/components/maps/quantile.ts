/**
 * Magnitude on the 6-step mark ramp by quantile: the mid-rank of a value among all numbers decides its step, so a few big
 * values cannot flatten everyone else, and equal values always get the same step. Null has no mark.
 */
export function markSteps(values: (number | null)[]): (number | null)[] {
  const nums = values.filter((v): v is number => v !== null).sort((a, b) => a - b)
  const n = nums.length
  return values.map((v) => {
    if (v === null) return null
    const below = nums.filter((x) => x < v).length
    const equal = nums.filter((x) => x === v).length
    const mid = (below + equal / 2) / n
    return Math.min(6, 1 + Math.floor(mid * 6))
  })
}

export type RampRow = { step: number; min: number; max: number; count: number }

/** The value range of each ramp step in use, for the legend. */
export function legendRamp(values: (number | null)[]): RampRow[] {
  const steps = markSteps(values)
  const rows = new Map<number, RampRow>()
  values.forEach((v, i) => {
    const s = steps[i]
    if (v === null || s === null || s === undefined) return
    const r = rows.get(s)
    if (r) {
      r.min = Math.min(r.min, v)
      r.max = Math.max(r.max, v)
      r.count++
    } else rows.set(s, { step: s, min: v, max: v, count: 1 })
  })
  return [...rows.values()].sort((a, b) => a.step - b.step)
}

export type PathItem = { code: string; d: string; cx: number; cy: number; labelX: number; labelY: number }

/** Reading order for Tab: west to east, then north to south. */
export const readingOrder = <T extends { cx: number; cy: number }>(items: T[]): T[] => [...items].sort((a, b) => a.cx - b.cx || a.cy - b.cy)

/** From this step on a fill is dark enough for white text; before it the text is dark (checked >= 4.5:1 against styles/palette-ramps.css). */
export const LIGHT_TEXT_FROM: Record<string, number> = { positive: 4, active: 5, recovered: 5, deceased: 5 }
export const lightText = (role: string, step: number) => step >= (LIGHT_TEXT_FROM[role] ?? 4)
export const rampVar = (role: string, step: number) => `var(--pico-ramp-${LIGHT_TEXT_FROM[role] ? role : 'positive'}-${step})`

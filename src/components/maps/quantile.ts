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

/** Steps of the sequential ramp (palette-ramps.css) and the most quantile classes a map uses (the legacy map used geostats getClassQuantile(9)). */
export const RAMP_STEPS = 9

/**
 * Quantile classes for the fill, like the legacy map: the mid-rank of a value decides its class out of at most 9, so a few big values cannot
 * flatten the rest and equal values always share a class. Rule for few or tied values: the number of classes never exceeds the number of
 * distinct values, a class that ends up with no area is dropped, and the classes in use are spread over the 9 ramp steps (1 and 9 are the
 * ends, so two classes are the lightest and the darkest). Null has no class (the no-data swatch). Returns the ramp step 1..9 per value.
 */
export function classSteps(values: (number | null)[]): (number | null)[] {
  const nums = values.filter((v): v is number => v !== null).sort((a, b) => a - b)
  const n = nums.length
  const k0 = Math.min(RAMP_STEPS, new Set(nums).size)
  const raw = values.map((v) => {
    if (v === null) return null
    const below = nums.filter((x) => x < v).length
    const equal = nums.filter((x) => x === v).length
    return Math.min(k0, 1 + Math.floor(((below + equal / 2) / n) * k0))
  })
  const used = [...new Set(raw.filter((c): c is number => c !== null))].sort((a, b) => a - b)
  const k = used.length
  return raw.map((c) => (c === null ? null : k === 1 ? RAMP_STEPS : Math.round(1 + (used.indexOf(c) * (RAMP_STEPS - 1)) / (k - 1))))
}

/** The value range of each fill class in use, for the legend of the Sebaran mode. */
export function legendClasses(values: (number | null)[]): RampRow[] {
  const steps = classSteps(values)
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

/** From this step on a fill is dark enough for white text; before it the text is black. Both pass 4.5:1 (checked in quantile.test.ts against palette-ramps.css). */
export const LIGHT_TEXT_FROM: Record<string, number> = { positive: 5, active: 9, recovered: RAMP_STEPS + 1, deceased: RAMP_STEPS + 1 }
export const lightText = (role: string, step: number) => step >= (LIGHT_TEXT_FROM[role] ?? 7)
export const rampVar = (role: string, step: number) => `var(--pico-ramp-${role in LIGHT_TEXT_FROM ? role : 'positive'}-${step})`

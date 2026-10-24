import { describe, expect, it } from 'vitest'
import { legendRamp, lightText, markSteps, rampVar, readingOrder } from './quantile'

describe('markSteps', () => {
  it('spreads distinct values over the six steps in order', () => {
    const steps = markSteps([10, 20, 30, 40, 50, 60])
    expect(steps).toEqual([1, 2, 3, 4, 5, 6])
  })
  it('one huge value does not flatten the rest (quantile, not linear)', () => {
    const steps = markSteps([1, 2, 3, 4, 5, 1_000_000])
    expect(steps.slice(0, 5)).toEqual([1, 2, 3, 4, 5])
    expect(steps[5]).toBe(6)
  })
  it('equal values get equal steps, and null gets no mark', () => {
    const s = markSteps([5, 5, 5, null, 9])
    expect(s[0]).toBe(s[1])
    expect(s[1]).toBe(s[2])
    expect(s[3]).toBeNull()
    expect(s[4]).toBeGreaterThan(s[0]!)
  })
  it('stays within 1..6 for 34 provinces and for a single value', () => {
    const s = markSteps(Array.from({ length: 34 }, (_, i) => i * i))
    expect(Math.min(...(s as number[]))).toBe(1)
    expect(Math.max(...(s as number[]))).toBe(6)
    expect(markSteps([42])).toEqual([4])
    expect(markSteps([])).toEqual([])
    expect(markSteps([null, null])).toEqual([null, null])
  })
  it('is monotonic: a bigger value never gets a smaller step', () => {
    const vals = [3, 91, 7, 1200, 15, 15, 80, 2, 640, 5, 33, 33, 9]
    const steps = markSteps(vals) as number[]
    for (let i = 0; i < vals.length; i++) for (let j = 0; j < vals.length; j++) if (vals[i]! < vals[j]!) expect(steps[i]!).toBeLessThanOrEqual(steps[j]!)
  })
})

describe('legendRamp', () => {
  it('gives the value range per step in use, ascending, with no gaps in coverage', () => {
    const vals = [10, 20, 30, 40, 50, 60, null]
    const ramp = legendRamp(vals)
    expect(ramp.map((r) => r.step)).toEqual([1, 2, 3, 4, 5, 6])
    expect(ramp[0]).toEqual({ step: 1, min: 10, max: 10, count: 1 })
    expect(ramp.at(-1)!.max).toBe(60)
  })
  it('lists only the steps that exist', () => {
    expect(legendRamp([1, 1]).length).toBe(1)
    expect(legendRamp([null])).toEqual([])
  })
})

describe('readingOrder', () => {
  it('west to east, ties north to south', () => {
    const o = readingOrder([{ cx: 5, cy: 1, k: 'c' }, { cx: 1, cy: 9, k: 'b' }, { cx: 1, cy: 2, k: 'a' }])
    expect(o.map((i) => i.k)).toEqual(['a', 'b', 'c'])
  })
})

describe('legend counts and ramp variables', () => {
  it('counts the areas per class, equal values together', () => {
    const r = legendRamp([5, 5, 5, 9, null])
    expect(r.reduce((n, x) => n + x.count, 0)).toBe(4)
    expect(r.find((x) => x.min === 5)!.count).toBe(3)
  })
  it('one ramp per case, light text only on the dark steps', () => {
    expect(rampVar('recovered', 3)).toBe('var(--pico-ramp-recovered-3)')
    expect(rampVar('rt', 2)).toBe('var(--pico-ramp-positive-2)')
    expect([1, 2, 3, 4, 5, 6].map((s) => lightText('active', s))).toEqual([false, false, false, false, true, true])
    expect([1, 2, 3, 4, 5, 6].map((s) => lightText('positive', s))).toEqual([false, false, false, true, true, true])
  })
})

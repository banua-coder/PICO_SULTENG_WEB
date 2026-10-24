import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { classSteps, legendClasses, legendRamp, lightText, markSteps, rampVar, readingOrder } from './quantile'

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
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => lightText('active', s))).toEqual([false, false, false, false, false, false, false, false, true])
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => lightText('positive', s))).toEqual([false, false, false, false, true, true, true, true, true])
    expect([1, 5, 9].map((s) => lightText('recovered', s))).toEqual([false, false, false]) // black text on the exact green and orange
  })
})

describe('classSteps (9 quantile classes, the legacy map)', () => {
  it('13 distinct values use 9 classes, ascending, ends on the two ends of the ramp', () => {
    const s = classSteps(Array.from({ length: 13 }, (_, i) => (i + 1) * 100)) as number[]
    expect(new Set(s).size).toBe(9)
    expect(Math.min(...s)).toBe(1)
    expect(Math.max(...s)).toBe(9)
    for (let i = 1; i < s.length; i++) expect(s[i]!).toBeGreaterThanOrEqual(s[i - 1]!)
  })
  it('fallback: never more classes than distinct values, no empty class, equal values share one, null has none', () => {
    expect(classSteps([5, 5, 5])).toEqual([9, 9, 9])
    const two = classSteps([1, 2, 2, null]) as (number | null)[]
    expect(two).toEqual([1, 9, 9, null])
    expect(new Set(classSteps([1, 2, 3, 4, 5])).size).toBe(5)
    expect(classSteps([null])).toEqual([null])
  })
  it('legend rows cover every non-null value once', () => {
    const v = [3, 9, 9, 40, 41, 100, 250, 251, 900, 5000, 5001, 7000, null]
    const rows = legendClasses(v)
    expect(rows.reduce((n, r) => n + r.count, 0)).toBe(12)
    expect(rows.length).toBeLessThanOrEqual(9)
  })
})

describe('palette-ramps.css', () => {
  const css = readFileSync(`${process.cwd()}/src/styles/palette-ramps.css`, 'utf8')
  const hex = (name: string) => css.match(new RegExp(`--pico-ramp-${name}:\\s*(#[0-9a-f]{6})`))![1]!
  const lum = (h: string) => {
    const f = (i: number) => {
      const v = parseInt(h.slice(i, i + 2), 16) / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * f(1) + 0.7152 * f(3) + 0.0722 * f(5)
  }
  const contrast = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
  it('ends on the exact legacy colours, and lightness only goes down', () => {
    // Positif is the legacy orange-red to dark red ramp (it passes the ordinal checks); the other three end on the exact role colours
    expect([hex('positive-1'), hex('positive-9')]).toEqual(['#e38e5d', '#900000'])
    expect([hex('active-9'), hex('recovered-9'), hex('deceased-9')]).toEqual(['#2563eb', '#10b981', '#f97316'])
    for (const r of ['positive', 'active', 'recovered', 'deceased']) for (let i = 2; i <= 9; i++) expect(lum(hex(`${r}-${i}`))).toBeLessThan(lum(hex(`${r}-${i - 1}`)))
  })
  it('the label colour of every step (black or white) has at least 4.5:1', () => {
    for (const r of ['positive', 'active', 'recovered', 'deceased']) for (let i = 1; i <= 9; i++) expect(contrast(hex(`${r}-${i}`), lightText(r, i) ? '#ffffff' : '#000000')).toBeGreaterThanOrEqual(4.5)
  })
})

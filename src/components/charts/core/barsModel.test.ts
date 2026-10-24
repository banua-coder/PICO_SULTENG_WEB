import { describe, expect, it } from 'vitest'
import { buildBars, wrapLabel } from './barsModel'

const items = [
  { key: 'a', label: '0 sampai 14 tahun', value: 100, role: 'positive' as const },
  { key: 'b', label: '15 sampai 19 tahun', value: 50, role: 'positive' as const },
  { key: 'c', label: 'Tanpa data', value: null, role: 'positive' as const },
]

describe('wrapLabel', () => {
  it('breaks at spaces and keeps a long word whole', () => {
    expect(wrapLabel('0 sampai 14 tahun', 8)).toEqual(['0 sampai', '14 tahun'])
    expect(wrapLabel('Kepulauan', 4)).toEqual(['Kepulauan'])
    expect(wrapLabel('', 5)).toEqual([''])
    expect(wrapLabel('a b c', 20)).toEqual(['a b c'])
  })
})

describe('buildBars horizontal', () => {
  const m = buildBars({ items, orientation: 'horizontal', width: 400 })
  const [a, b, c] = m.bars
  it('bar length is proportional to value, up to the biggest', () => {
    expect(b!.rect!.w).toBeCloseTo(a!.rect!.w / 2)
    expect(a!.rect!.w).toBeLessThanOrEqual(400 - 76)
  })
  it('the number sits at the end of its bar, on plain ground (right of the rect)', () => {
    expect(a!.valueAt.x).toBeGreaterThan(a!.rect!.x + a!.rect!.w)
    expect(a!.valueAt.anchor).toBe('start')
  })
  it('null has no bar and its text sits at the start', () => {
    expect(c!.rect).toBeNull()
    expect(c!.valueAt.x).toBe(0)
  })
  it('one row per item and each label above its bar', () => {
    expect(m.height).toBe(3 * 56)
    expect(a!.labelAt.y).toBeLessThan(a!.rect!.y)
    expect(b!.rect!.y).toBeGreaterThan(a!.rect!.y)
  })
  it('max sets the full scale, and a value over max fills the bar instead of overflowing', () => {
    const p = buildBars({ items: [{ key: 'x', label: 'x', value: 120, role: 'recovered' }, { key: 'y', label: 'y', value: 50, role: 'recovered' }], orientation: 'horizontal', width: 400, max: 100 })
    expect(p.bars[0]!.rect!.w).toBeCloseTo(324)
    expect(p.bars[1]!.rect!.w).toBeCloseTo(162)
  })
  it('a tiny positive value is still visible and zero draws nothing', () => {
    const p = buildBars({ items: [{ key: 'x', label: 'x', value: 1, role: 'rt' }, { key: 'y', label: 'y', value: 0, role: 'rt' }, { key: 'z', label: 'z', value: 100000, role: 'rt' }], orientation: 'horizontal', width: 400 })
    expect(p.bars[0]!.rect!.w).toBeGreaterThanOrEqual(2)
    expect(p.bars[1]!.rect!.w).toBe(0)
  })
  it('no items and all-null items do not throw', () => {
    expect(buildBars({ items: [], orientation: 'horizontal', width: 300 }).bars).toEqual([])
    expect(buildBars({ items: [{ key: 'x', label: 'x', value: null, role: 'rt' }], orientation: 'horizontal', width: 300 }).bars[0]!.rect).toBeNull()
  })
})

describe('buildBars vertical', () => {
  const m = buildBars({ items, orientation: 'vertical', width: 360 })
  it('bars stand on one baseline and grow upward with value', () => {
    const [a, b] = m.bars
    expect(a!.rect!.y + a!.rect!.h).toBeCloseTo(b!.rect!.y + b!.rect!.h)
    expect(a!.rect!.h).toBeCloseTo(b!.rect!.h * 2)
  })
  it('labels wrap under the bar on a narrow chart, centred, at most 3 lines', () => {
    const narrow = buildBars({ items, orientation: 'vertical', width: 200 })
    expect(narrow.bars[0]!.lines.length).toBeGreaterThan(1)
    expect(narrow.bars.every((b) => b.lines.length <= 3)).toBe(true)
    expect(m.bars[0]!.labelAt.anchor).toBe('middle')
  })
  it('the number is above the bar, and null says so near the baseline', () => {
    expect(m.bars[0]!.valueAt.y).toBeLessThan(m.bars[0]!.rect!.y)
    expect(m.bars[2]!.rect).toBeNull()
  })
  it('columns do not overlap', () => {
    const xs = m.bars.filter((b) => b.rect).map((b) => b.rect!)
    expect(xs[1]!.x).toBeGreaterThanOrEqual(xs[0]!.x + xs[0]!.w)
  })
})

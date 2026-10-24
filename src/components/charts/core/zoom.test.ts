import { describe, expect, it } from 'vitest'
import { brushToRange, clampRange, panBy, zoomAround } from './zoom'

const B: [number, number] = [0, 1000]
describe('zoom maths', () => {
  it('clampRange keeps whole days, the minimum span and the bounds', () => {
    expect(clampRange([-50, 20], B)).toEqual([0, 70])
    expect(clampRange([990, 1100], B)).toEqual([890, 1000])
    expect(clampRange([10, 11], B)).toEqual([10, 13])
    expect(clampRange([0, 5000], B)).toEqual([0, 1000])
    expect(clampRange([5, 6], [0, 2])).toEqual([0, 2])
  })
  it('zoomAround keeps the focus day where it was', () => {
    const r = zoomAround([0, 1000], B, 500, 0.5)
    expect(r).toEqual([250, 750])
    const r2 = zoomAround([0, 1000], B, 0, 0.5)
    expect(r2).toEqual([0, 500])
    expect(zoomAround([250, 750], B, 500, 4)).toEqual([0, 1000])
  })
  it('panBy stops at the ends', () => {
    expect(panBy([100, 200], B, 50)).toEqual([150, 250])
    expect(panBy([100, 200], B, -500)).toEqual([0, 100])
    expect(panBy([900, 1000], B, 500)).toEqual([900, 1000])
  })
  it('brushToRange maps pixels to days, either direction, and ignores clicks', () => {
    expect(brushToRange(100, 300, 1000, [0, 1000], B)).toEqual([100, 300])
    expect(brushToRange(300, 100, 1000, [0, 1000], B)).toEqual([100, 300])
    expect(brushToRange(100, 102, 1000, [0, 1000], B)).toBeNull()
    expect(brushToRange(0, 5, 1000, [0, 100], [0, 100])).toBeNull() // under 3 days
    expect(brushToRange(-40, 2000, 1000, [0, 1000], B)).toEqual([0, 1000])
  })
})

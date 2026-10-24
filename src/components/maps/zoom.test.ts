import { describe, expect, it } from 'vitest'
import { clampView, fullView, MAX_ZOOM, panBy, zoomAt, zoomLevel } from './zoom'

const base: [number, number] = [800, 600]
describe('zoom', () => {
  it('starts on the full map and zooms in around a point, keeping the aspect ratio', () => {
    const v = zoomAt(fullView(base), base, 2, 0.5, 0.5)
    expect(v).toEqual({ x: 200, y: 150, w: 400, h: 300 })
    expect(zoomLevel(v, base)).toBe(2)
  })
  it('keeps the point under the pointer fixed', () => {
    const v = zoomAt(fullView(base), base, 2, 0, 0)
    expect([v.x, v.y]).toEqual([0, 0])
  })
  it('never zooms out past the map or in past MAX_ZOOM', () => {
    expect(zoomAt(fullView(base), base, 0.5)).toEqual(fullView(base))
    expect(zoomLevel(zoomAt(fullView(base), base, 1000), base)).toBe(MAX_ZOOM)
  })
  it('pan stays inside the map', () => {
    const v = zoomAt(fullView(base), base, 2)
    expect(panBy(v, base, -9999, 9999)).toMatchObject({ x: 0, y: 300 })
    expect(clampView({ x: 700, y: 0, w: 400, h: 300 }, base).x).toBe(400)
  })
})

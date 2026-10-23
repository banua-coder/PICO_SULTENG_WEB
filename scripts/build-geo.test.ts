// @vitest-environment node
import { gzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { INDONESIA_ALIASES, buildPaths, joinIndonesia, joinSulteng, polygonArea, simplify } from './build-geo'
import { KABUPATEN_AREAS, PROVINCE_AREAS } from '../src/app/areas'

const read = (n: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`./geo-src/${n}.json`, import.meta.url)), 'utf8'))
const square = (x: number, y: number, s: number) => [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]]

describe('simplify (Douglas-Peucker)', () => {
  it('drops points within the tolerance of the line, keeps real corners', () => {
    const line = [[0, 0], [5, 0.2], [10, 0], [10, 10]]
    expect(simplify(line, 0.5)).toEqual([[0, 0], [10, 0], [10, 10]])
    expect(simplify(line, 0.1)).toEqual(line)
  })
  it('keeps a closed ring closed and at least 4 points', () => {
    const ring = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
    expect(simplify(ring, 0.5)).toEqual(ring)
  })
  it('area of a square', () => expect(Math.abs(polygonArea([[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]))).toBe(16))
})

describe('join (C5 slug table)', () => {
  it('sulteng joins all 13 by the API name', () => {
    const codes = joinSulteng(read('sulteng')).map((f) => f.code)
    expect([...codes].sort()).toEqual(KABUPATEN_AREAS.map((a) => a.code).sort())
  })
  it('indonesia joins all 34 by upper-case name, with one alias (DI YOGYAKARTA)', () => {
    const codes = joinIndonesia(read('indonesia')).map((f) => f.code)
    expect([...codes].sort()).toEqual(PROVINCE_AREAS.map((a) => a.code).sort())
    expect(Object.keys(INDONESIA_ALIASES)).toEqual(['DI YOGYAKARTA'])
  })
  it('FAILS for a renamed feature', () => {
    const src = read('sulteng')
    src.features[0].properties.id = 'Donggala Baru'
    expect(() => joinSulteng(src)).toThrow(/unmatched.*Donggala Baru/)
  })
  it('FAILS for a duplicated feature and for a missing one', () => {
    const dup = read('sulteng')
    dup.features[1] = JSON.parse(JSON.stringify(dup.features[0]))
    expect(() => joinSulteng(dup)).toThrow(/duplicate/)
    const miss = read('sulteng')
    miss.features.pop()
    expect(() => joinSulteng(miss)).toThrow(/missing/)
  })
  it('indonesia fails for an unknown province name', () => {
    const src = read('indonesia')
    src.features[3].properties.name = 'ATLANTIS'
    expect(() => joinIndonesia(src)).toThrow(/unmatched.*ATLANTIS/)
  })
})

describe('buildPaths', () => {
  const joined = [
    { code: '1', geometry: { type: 'MultiPolygon', coordinates: [square(100, 0, 2), square(110, 0, 0.001)] } },
    { code: '2', geometry: { type: 'MultiPolygon', coordinates: [square(104, 0, 3)] } },
  ] as never
  const out = buildPaths(joined, [800, 600], { minArea: 4 })

  it('outputs code, d, cx, cy, labelX, labelY with 1-decimal coordinates inside the box', () => {
    expect(out.map((o) => o.code)).toEqual(['1', '2'])
    for (const o of out) {
      expect(o.d).toMatch(/^M[-\d.]+ [-\d.]+/)
      expect(o.d).not.toMatch(/\d\.\d\d/)
      expect(o.cx).toBeGreaterThanOrEqual(0)
      expect(o.cx).toBeLessThanOrEqual(800)
      expect(o.cy).toBeLessThanOrEqual(600)
    }
  })
  it('drops specks under the minimum area but never the last polygon of an area', () => {
    expect((out[0]!.d.match(/M/g) ?? []).length).toBe(1) // the tiny square is gone
    const tiny = buildPaths([{ code: '3', geometry: { type: 'MultiPolygon', coordinates: [square(100, 0, 0.0001)] } }] as never, [800, 600], { minArea: 4 })
    expect((tiny[0]!.d.match(/M/g) ?? []).length).toBe(1)
  })
  it('a small area gets its label pushed outwards from the middle of the map, a big one keeps it', () => {
    const j = [
      { code: 'big', geometry: { type: 'MultiPolygon', coordinates: [square(100, 0, 8)] } },
      { code: 'tiny', geometry: { type: 'MultiPolygon', coordinates: [square(109, 0, 1)] } },
    ] as never
    const [b2, t2] = buildPaths(j, [800, 600], { smallArea: 10000, leader: 40 })
    expect(b2!.labelX).toBe(b2!.cx)
    expect(t2!.labelX).toBeGreaterThan(t2!.cx) // pushed east, away from the middle
  })
  it('the centroid sits inside the largest polygon', () => {
    const [a] = buildPaths([{ code: '1', geometry: { type: 'MultiPolygon', coordinates: [square(100, 0, 2), square(110, 0, 0.5)] } }] as never, [800, 600], {})
    expect(a!.cx).toBeLessThan(700) // not pulled halfway to the small far square
  })
})

describe('the shipped path files', () => {
  const load = (n: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../src/components/maps/geo/${n}.paths.json`, import.meta.url)), 'utf8')) as { code: string; d: string; cx: number; cy: number; labelX: number; labelY: number }[]
  const files = { sulteng: load('sulteng'), indonesia: load('indonesia') }

  it('both files together are at most 40 KB gzip', () => {
    const gz = Object.values(files).reduce((n, f) => n + gzipSync(JSON.stringify(f)).length, 0)
    console.log(`geo paths gzip: ${gz} bytes`)
    expect(gz).toBeLessThanOrEqual(40 * 1024)
  })
  it('Banggai Laut, Banggai Kepulauan and Kota Palu have leader labels, big areas do not', () => {
    const moved = files.sulteng.filter((f) => f.labelX !== f.cx || f.labelY !== f.cy).map((f) => f.code).sort()
    expect(moved).toEqual(['7201', '7211', '7271'])
  })
  it('13 kabupaten and 34 provinces, each with at least one polygon', () => {
    expect(files.sulteng).toHaveLength(13)
    expect(files.indonesia).toHaveLength(34)
    for (const f of [...files.sulteng, ...files.indonesia]) expect((f.d.match(/M/g) ?? []).length).toBeGreaterThanOrEqual(1)
  })
  it('every centroid and label is inside the viewBox', () => {
    const inside = (list: typeof files.sulteng, w: number, h: number) =>
      list.every((f) => [f.cx, f.labelX].every((v) => v >= 0 && v <= w) && [f.cy, f.labelY].every((v) => v >= 0 && v <= h))
    expect(inside(files.sulteng, 800, 600)).toBe(true)
    expect(inside(files.indonesia, 1000, 420)).toBe(true)
  })
})

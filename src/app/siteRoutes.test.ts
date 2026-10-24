import { describe, expect, it } from 'vitest'
import { buildRoutes } from './routeTable'
import { sitePaths, sitePairs } from './siteRoutes'
import { createMemoryHistory, createRouter } from 'vue-router'

describe('siteRoutes (C5)', () => {
  it('lists 116 unique paths: 2 x (11 + 34 + 13)', () => {
    const p = sitePaths()
    expect(p).toHaveLength(116)
    expect(new Set(p).size).toBe(116)
  })
  it('Indonesian has no prefix, English is /en, Beranda is /en/', () => {
    const p = sitePaths()
    expect(p).toContain('/')
    expect(p).toContain('/en/')
    expect(p).toContain('/data/provinsi/aceh')
    expect(p).toContain('/en/data/kabupaten/kota-palu')
    expect(p.filter((x) => x.startsWith('/en')).length).toBe(58)
  })
  it('both locales of a page are adjacent', () => {
    const pairs = sitePairs()
    expect(pairs[1]).toEqual(['/mulai', '/en/mulai'])
    expect(sitePaths().slice(0, 4)).toEqual(['/', '/en/', '/mulai', '/en/mulai'])
  })
  it('every path resolves to a real route, not the not-found route', () => {
    const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
    for (const p of sitePaths()) expect(router.resolve(p).name, p).not.toBe('tidak-ditemukan')
  })
})

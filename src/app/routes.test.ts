import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { KABUPATEN_AREAS, PROVINCE_AREAS } from './areas'
import { isNavActive, NAV_ITEMS } from './nav'
import { buildRoutes } from './routeTable'
import { scrollBehavior } from './routes'

const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
const nameOf = (path: string) => router.resolve(path).name

describe('C5 route table', () => {
  const C5: [string, string][] = [
    ['/', 'beranda'],
    ['/data', 'data'],
    ['/data/indonesia', 'data-nasional'],
    ['/data/provinsi/aceh', 'data-provinsi'],
    ['/data/kabupaten/kota-palu', 'data-kabupaten'],
    ['/tabel-data', 'tabel'],
    ['/vaksin', 'vaksin'],
    ['/infografis', 'infografis'],
    ['/kontak', 'kontak'],
    ['/wiki', 'wiki'],
    ['/isoman', 'isoman'],
    ['/metodologi', 'metodologi'],
  ]

  it.each(C5)('%s resolves in Indonesian as %s', (path, name) => expect(nameOf(path)).toBe(name))

  it.each(C5)('%s resolves in English under /en as %s.en', (path, name) => {
    const en = path === '/' ? '/en/' : `/en${path}`
    expect(nameOf(en)).toBe(`${name}.en`)
  })

  it('/en without the trailing slash is Beranda too', () => expect(nameOf('/en')).toBe('beranda.en'))

  it('every province and kabupaten slug has a route in both locales', () => {
    for (const a of PROVINCE_AREAS) {
      expect(nameOf(`/data/provinsi/${a.slug}`)).toBe('data-provinsi')
      expect(nameOf(`/en/data/provinsi/${a.slug}`)).toBe('data-provinsi.en')
    }
    for (const a of KABUPATEN_AREAS) expect(nameOf(`/data/kabupaten/${a.slug}`)).toBe('data-kabupaten')
  })

  it('anything else is the not-found route, in both locales', () => {
    for (const p of ['/tidak-ada', '/en/nope', '/data/x/y/z', '/_kit']) expect(nameOf(p)).toBe('tidak-ditemukan')
  })

  it('route names are unique', () => {
    const names = buildRoutes().map((r) => r.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('the 9 nav items are real routes', () => {
    expect(NAV_ITEMS).toHaveLength(9)
    for (const i of NAV_ITEMS) expect(nameOf(i.path)).not.toBe('tidak-ditemukan')
  })
})

describe('nav active state', () => {
  it('exact for Beranda, and prefix for the sections', () => {
    expect(isNavActive('/', '/')).toBe(true)
    expect(isNavActive('/', '/data')).toBe(false)
    expect(isNavActive('/data', '/data/provinsi/aceh')).toBe(true)
    expect(isNavActive('/data', '/en/data/indonesia')).toBe(true)
    expect(isNavActive('/data', '/tabel-data')).toBe(false)
    expect(isNavActive('/', '/en/')).toBe(true)
  })
})

describe('scrollBehavior', () => {
  it('top on a new page, nothing on a query-only change, saved position on back, hash target', () => {
    expect(scrollBehavior({ hash: '', path: '/a' }, { path: '/b' }, null)).toEqual({ top: 0 })
    expect(scrollBehavior({ hash: '', path: '/a' }, { path: '/a' }, null)).toBe(false)
    expect(scrollBehavior({ hash: '', path: '/a' }, { path: '/b' }, { left: 0, top: 120 })).toEqual({ left: 0, top: 120 })
    expect(scrollBehavior({ hash: '#rt', path: '/a' }, { path: '/a' }, null)).toMatchObject({ el: '#rt' })
  })
})

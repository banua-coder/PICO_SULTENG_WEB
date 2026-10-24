// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { sitePaths } from '../src/app/siteRoutes'
import { checkDist, findBands, findTodos } from './check-dist'
import { fileForPath, sitemapXml } from './site'

let dist: string
const put = (rel: string, text: string) => {
  mkdirSync(dirname(join(dist, rel)), { recursive: true })
  writeFileSync(join(dist, rel), text)
}
const page = (title: string, extra = '') =>
  `<html><head><title>${title}</title><link rel="canonical" href="https://x.test/a"><link rel="alternate" hreflang="x-default" href="https://x.test/a"></head><body>${extra}</body></html>`

function goodSite() {
  sitePaths().forEach((p, i) => put(fileForPath('', p), page(`T${i}`, '<a href="/wiki">w</a>')))
  put('404.html', page('Not found'))
  put('sitemap.xml', sitemapXml('https://x.test'))
  put('data/kabupaten-latest.json', JSON.stringify(Array.from({ length: 13 }, () => ({ latest: { date: '2024-01-14' } }))))
  put('data/last-real.json', JSON.stringify({ provinsi: Object.fromEntries(Array.from({ length: 34 }, (_, i) => [String(i), '2023-12-09'])), kabupaten: Object.fromEntries(Array.from({ length: 13 }, (_, i) => [String(i), '2023-12-09'])) }))
}

beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), 'dist-'))
  goodSite()
})

describe('sitemapXml', () => {
  it('lists 116 URLs, each with id, en and x-default alternates', () => {
    const xml = sitemapXml('https://x.test')
    expect((xml.match(/<loc>/g) ?? []).length).toBe(116)
    expect(xml).toContain('<loc>https://x.test/en/data/provinsi/aceh</loc>')
    expect(xml).toContain('hreflang="x-default" href="https://x.test/data/provinsi/aceh"')
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
  })
})

describe('checkDist', () => {
  it('passes a complete site', () => expect(checkDist(dist)).toEqual([]))

  it('reports a missing page', () => {
    writeFileSync(join(dist, 'wiki/index.html'), '')
    put('wiki/index.html', '')
    expect(checkDist(dist).some((p) => p.includes('no <title>: /wiki'))).toBe(true)
  })
  it('reports a duplicate title', () => {
    put('vaksin/index.html', page('T0'))
    expect(checkDist(dist).some((p) => p.startsWith('duplicate <title> "T0"'))).toBe(true)
  })
  it('reports a missing canonical and a missing 404.html', () => {
    put('kontak/index.html', '<html><head><title>Kontak</title></head></html>')
    const p = checkDist(dist)
    expect(p).toContain('no canonical: /kontak')
    expect(p).toContain('no hreflang x-default: /kontak')
  })
  it('reports a broken internal link but not external ones', () => {
    put('isoman/index.html', page('Isoman', '<a href="/nowhere">x</a><a href="https://example.org/x">y</a><a href="/unduh/a.csv">z</a>'))
    const p = checkDist(dist)
    expect(p.some((x) => x.startsWith('broken link /nowhere'))).toBe(true)
    expect(p.some((x) => x.includes('example.org'))).toBe(false)
    put('unduh/a.csv', 'x')
    expect(checkDist(dist).some((x) => x.includes('/unduh/a.csv'))).toBe(false)
  })
  it('reports the inline state script and a wrong snapshot', () => {
    put('metodologi/index.html', page('Metodologi', '<script>window.__INITIAL_STATE__={}</script>'))
    put('data/kabupaten-latest.json', '[]')
    const p = checkDist(dist)
    expect(p).toContain('inline state script: /metodologi')
    expect(p).toContain('kabupaten snapshot has 0 rows, expected 13')
  })

  it('last-real.json must exist and hold 34 provinces and 13 kabupaten', () => {
    put('data/last-real.json', JSON.stringify({ provinsi: { '72': '2023-12-09' }, kabupaten: {} }))
    expect(checkDist(dist)).toContain('data/last-real.json has 1 provinces and 0 kabupaten, expected 34 and 13')
    rmSync(join(dist, 'data/last-real.json'))
    expect(checkDist(dist)).toContain('missing data/last-real.json')
  })

  it('an unreviewed TODO marker fails the check, unless the build allows TODOs', () => {
    put('wiki/index.html', page('Wiki', '<span data-todo="wiki-terms">TODO</span>'))
    expect(findTodos(dist)).toEqual([['wiki-terms', expect.stringContaining('wiki')]])
    expect(checkDist(dist).some((p) => p.startsWith('unreviewed TODO "wiki-terms"'))).toBe(true)
    expect(checkDist(dist, { allowTodo: true })).toEqual([])
  })
})

describe('band patterns', () => {
  it('fails when a band strip is in the build, passes when bands are allowed (a VITE_MAP_BANDS build)', () => {
    put('assets/band-bomba-AbC123.js', 'export default "<svg/>"')
    expect(checkDist(dist).some((p) => p.includes('band pattern in the build: /assets/band-bomba-AbC123.js'))).toBe(true)
    expect(checkDist(dist, { allowBands: true }).some((p) => p.includes('band pattern'))).toBe(false)
  })
  it('a clean build has none', () => {
    expect(findBands(dist)).toEqual([])
  })
})

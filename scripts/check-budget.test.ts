// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { beforeEach, describe, expect, it } from 'vitest'
import { checkBudget, initialScripts, table } from './check-budget'

let dist: string
let geo: string
const put = (rel: string, data: string | Buffer) => {
  mkdirSync(dirname(join(dist, rel)), { recursive: true })
  writeFileSync(join(dist, rel), data)
}
const noise = (n: number) => randomBytes(n) // incompressible: gzip size is about n
const page = (scripts: string[]) => `<html><head>${scripts.map((s, i) => (i === 0 ? `<script type="module" async src="/assets/${s}"></script>` : `<link rel="modulepreload" href="/assets/${s}">`)).join('')}</head></html>`
const gzLen = (b: Buffer) => gzipSync(b, { level: 9 }).length

beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), 'budget-'))
  geo = mkdtempSync(join(tmpdir(), 'geo-'))
  writeFileSync(join(geo, 'a.paths.json'), '[]')
  put('index.html', page(['app-1.js', 'beranda-1.js']))
  put('data/provinsi/sulawesi-tengah/index.html', page(['app-1.js', 'data-1.js']))
  put('wiki/index.html', page(['app-1.js', 'wiki-1.js']))
  put('404.html', page(['app-1.js']))
  put('assets/app-1.js', noise(1000))
  put('assets/beranda-1.js', noise(500))
  put('assets/data-1.js', noise(800))
  put('assets/wiki-1.js', noise(400))
  put('assets/a.css', 'body{}')
  put('assets/f.woff2', noise(100))
})

describe('initialScripts', () => {
  it('reads the module script and the modulepreload links, nothing lazy', () => {
    expect(initialScripts(page(['app-1.js', 'view-1.js']))).toEqual(['/assets/app-1.js', '/assets/view-1.js'])
  })
})

describe('checkBudget', () => {
  it('passes a small site and prints a table', () => {
    const { rows, problems } = checkBudget(dist, geo)
    expect(problems).toEqual([])
    expect(rows.map((r) => r.item)).toEqual(['Beranda initial JS', 'Data initial JS', 'Other routes, largest initial JS', 'CSS total', 'Fonts', 'Map path JSON (both)', 'Largest prerendered HTML'])
    expect(table(rows)).toContain('Beranda initial JS')
    expect(table(rows).split('\n').every((l) => l.startsWith('ok'))).toBe(true)
  })

  it('fails on a 1-byte overrun and passes at the exact size (spec 80)', () => {
    const exact = gzLen(readBack('assets/app-1.js')) + gzLen(readBack('assets/beranda-1.js'))
    expect(checkBudget(dist, geo, { beranda: exact }).problems).toEqual([])
    const over = checkBudget(dist, geo, { beranda: exact - 1 })
    expect(over.problems).toHaveLength(1)
    expect(over.problems[0]).toContain('Beranda initial JS')
    expect(over.rows[0]!.ok).toBe(false)
  })

  it.each([['xlsx-abc.js'], ['d3-abc.js'], ['lottie_light-abc.js']])('fails when %s is part of a page\'s initial JS, even under the size limit', (heavy) => {
    put('assets/' + heavy, noise(50))
    put('index.html', page(['app-1.js', 'beranda-1.js', heavy]))
    const { problems } = checkBudget(dist, geo)
    expect(problems.some((p) => p.includes(heavy) && p.includes('heavy library'))).toBe(true)
  })

  it('a heavy chunk that is NOT preloaded (lazy) is fine', () => {
    put('assets/xlsx-abc.js', noise(5000))
    expect(checkBudget(dist, geo).problems).toEqual([])
  })

  it('fails on a missing file a page asks for', () => {
    put('wiki/index.html', page(['app-1.js', 'gone.js']))
    expect(checkBudget(dist, geo).problems.some((p) => p.includes('missing file'))).toBe(true)
  })

  it('each limit is checked: CSS, fonts, geo, HTML, other routes', () => {
    expect(checkBudget(dist, geo, { css: 1 }).problems[0]).toContain('CSS total')
    expect(checkBudget(dist, geo, { fonts: 50 }).problems[0]).toContain('Fonts')
    expect(checkBudget(dist, geo, { geo: 1 }).problems[0]).toContain('Map path JSON')
    expect(checkBudget(dist, geo, { html: 10 }).problems[0]).toContain('Largest prerendered HTML')
    expect(checkBudget(dist, geo, { other: 100 }).problems[0]).toContain('Other routes')
    expect(checkBudget(dist, geo, { data: 100 }).problems[0]).toContain('Data initial JS')
  })
})

function readBack(rel: string) {
  return readFileSync(join(dist, rel))
}

// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain JS script
import { checkBrand, plan, syncBrand } from './sync-brand.mjs'

let source: string
let root: string

const put = (base: string, rel: string, text: string) => {
  mkdirSync(join(base, rel, '..'), { recursive: true })
  writeFileSync(join(base, rel), text)
}

beforeEach(() => {
  source = mkdtempSync(join(tmpdir(), 'brand-src-'))
  root = mkdtempSync(join(tmpdir(), 'brand-dst-'))
  // one file per planned location, as the real brand dir has
  for (const rel of [
    'tokens/pico-tokens.css',
    'logo/favicon/favicon.svg',
    'logo/favicon/favicon.ico',
    'logo/favicon/apple-touch-icon-180.png',
    'logo/favicon/icon-192.png',
    'logo/favicon/icon-512.png',
    'logo/app-icon/app-icon-maskable-512.png',
    'logo/og/og-image-1200x630.png',
  ])
    put(source, rel, `file ${rel}`)
  put(source, 'icons/mono/a.svg', '<svg/>')
  put(source, 'icons/index.json', JSON.stringify({ icons: [{ key: 'state.positive' }, { key: 'map' }] }))
})

describe('sync-brand', () => {
  it('copies the planned files and the check passes', () => {
    expect(syncBrand({ source, root })).toBe(plan(source).length + 1) // + generated icon-keys.ts
    expect(checkBrand({ root, source })).toEqual([])
  })

  it('generates the IconKey union from the icon index', () => {
    syncBrand({ source, root })
    expect(readFileSync(join(root, 'src/assets/brand/icon-keys.ts'), 'utf8')).toContain('["state.positive","map"]')
  })

  it('fails when a committed copy is edited by hand', () => {
    syncBrand({ source, root })
    writeFileSync(join(root, 'src/assets/brand/pico-tokens.css'), ':root{--pico-paper:#fff}')
    expect(checkBrand({ root })).toEqual(['changed by hand: src/assets/brand/pico-tokens.css'])
  })

  it('fails when a copy is missing or an unlisted file appears', () => {
    syncBrand({ source, root })
    writeFileSync(join(root, 'public/favicon.svg'), 'x')
    put(root, 'src/assets/brand/icons/mono/extra.svg', '<svg/>')
    const problems = checkBrand({ root })
    expect(problems).toContain('changed by hand: public/favicon.svg')
    expect(problems).toContain('not in manifest: src/assets/brand/icons/mono/extra.svg')
  })

  it('fails when the source moved on after the sync', () => {
    syncBrand({ source, root })
    writeFileSync(join(source, 'tokens/pico-tokens.css'), 'new tokens')
    expect(checkBrand({ root, source })).toEqual(['source moved on: tokens/pico-tokens.css'])
    expect(checkBrand({ root })).toEqual([]) // CI has no source: manifest check only
  })

  it('refuses to sync from a source that lacks a listed file', () => {
    mkdirSync(join(source, 'x'))
    expect(() => syncBrand({ source: join(source, 'x'), root })).toThrow(/missing/)
  })
})

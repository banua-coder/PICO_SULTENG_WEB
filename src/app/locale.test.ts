import { describe, expect, it } from 'vitest'
import { localeFromPath, localizePath, otherLocale, stripLocale, switchLocalePath } from './locale'

describe('locale paths (C5)', () => {
  it.each([
    ['/', 'id'],
    ['/data', 'id'],
    ['/en', 'en'],
    ['/en/', 'en'],
    ['/en/data/provinsi/aceh', 'en'],
    ['/english', 'id'],
    ['/data/en', 'id'],
    ['/id/data', 'id'],
  ])('localeFromPath(%s) = %s', (path, want) => expect(localeFromPath(path)).toBe(want))

  it.each([
    ['/', '/'],
    ['/en', '/'],
    ['/en/', '/'],
    ['/en/data', '/data'],
    ['/data', '/data'],
    ['/english', '/english'],
  ])('stripLocale(%s) = %s', (path, want) => expect(stripLocale(path)).toBe(want))

  it('localizePath: id has no prefix, en has /en, beranda is /en/', () => {
    expect(localizePath('/', 'id')).toBe('/')
    expect(localizePath('/', 'en')).toBe('/en/')
    expect(localizePath('/data', 'en')).toBe('/en/data')
    expect(localizePath('/en/data', 'id')).toBe('/data')
    expect(localizePath('/en/data', 'en')).toBe('/en/data')
  })

  it('switches id -> en and back, keeping query and hash (C5 acceptance)', () => {
    const idUrl = '/data/provinsi/aceh?dari=2021-01-01'
    const enUrl = '/en/data/provinsi/aceh?dari=2021-01-01'
    expect(switchLocalePath(idUrl, 'en')).toBe(enUrl)
    expect(switchLocalePath(enUrl, 'id')).toBe(idUrl)
    expect(switchLocalePath('/tabel-data?hal=2#top', 'en')).toBe('/en/tabel-data?hal=2#top')
    expect(switchLocalePath('/', 'en')).toBe('/en/')
    expect(switchLocalePath('/en/', 'id')).toBe('/')
  })

  it('otherLocale', () => {
    expect(otherLocale('id')).toBe('en')
    expect(otherLocale('en')).toBe('id')
  })
})

import { describe, expect, it } from 'vitest'
import { diffLocales, flatten } from './check-i18n'

describe('flatten', () => {
  it('flattens nested messages to dotted keys', () => {
    expect(flatten({ a: { b: 'x', c: { d: 'y' } }, e: 'z' })).toEqual({ 'a.b': 'x', 'a.c.d': 'y', e: 'z' })
  })
})

describe('diffLocales', () => {
  const id = { a: 'satu', b: { c: 'dua {n}' } }

  it('is clean for equal key sets', () => {
    expect(diffLocales(id, { a: 'one', b: { c: 'two {n}' } })).toEqual([])
  })
  it('reports a key missing in en', () => {
    expect(diffLocales(id, { a: 'one', b: {} })).toEqual(['missing in en: b.c'])
  })
  it('reports a key missing in id', () => {
    expect(diffLocales({ a: 'x' }, { a: 'x', extra: 'y' })).toEqual(['missing in id: extra'])
  })
  it('reports an empty message', () => {
    expect(diffLocales({ a: 'x' }, { a: '' })).toEqual(['empty in en: a'])
  })
  it('reports different placeholders', () => {
    expect(diffLocales({ a: 'halo {name}' }, { a: 'hello {nama}' })).toEqual(['placeholders differ at a: id {name} vs en {nama}'])
  })
})

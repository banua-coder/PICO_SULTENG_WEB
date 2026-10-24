import { describe, expect, it } from 'vitest'
import { fx } from '../../test/fixtures/load'
import { areaByCode, areaBySlug, KABUPATEN_AREAS, kabupatenApiName, PROVINCE_AREAS, slugify } from './areas'

describe('slug table (C5)', () => {
  it('slugify: lowercase, runs of non [a-z0-9] become one dash, trimmed', () => {
    expect(slugify('Daerah Istimewa Yogyakarta')).toBe('daerah-istimewa-yogyakarta')
    expect(slugify('  Tojo Una-Una ')).toBe('tojo-una-una')
    expect(slugify('A & B / C')).toBe('a-b-c')
  })

  it('has 34 provinces and 13 kabupaten with unique codes and slugs', () => {
    expect(PROVINCE_AREAS).toHaveLength(34)
    expect(KABUPATEN_AREAS).toHaveLength(13)
    for (const set of [PROVINCE_AREAS, KABUPATEN_AREAS]) {
      expect(new Set(set.map((a) => a.slug)).size).toBe(set.length)
      expect(new Set(set.map((a) => a.code)).size).toBe(set.length)
    }
  })

  it('every slug is slugify(name)', () => {
    for (const a of [...PROVINCE_AREAS, ...KABUPATEN_AREAS]) expect(a.slug).toBe(slugify(a.name))
  })

  it('matches the live province list (codes and names)', () => {
    const live = fx<{ id: string; name: string }[]>('province-ids')
    expect(live).toHaveLength(34)
    for (const p of live) expect(areaByCode('provinsi', p.id)?.name).toBe(p.name)
  })

  it('matches the live regency list; the API spelling differs only for 7206 and 7208 (O-7, Q8)', () => {
    const live = fx<{ id: number; name: string }[]>('regencies')
    expect(live).toHaveLength(13)
    for (const r of live) {
      expect(kabupatenApiName(r.id)).toBe(r.name)
      const display = areaByCode('kabupaten', r.id)!.name
      if (display !== r.name) expect([7206, 7208]).toContain(r.id)
    }
    expect(areaByCode('kabupaten', 7208)?.name).toBe('Parigi Moutong')
    expect(areaByCode('kabupaten', 7206)?.slug).toBe('tolitoli')
  })

  it('looks up by slug and code, and an unknown province slug is undefined (Q9: the table decides, not the API)', () => {
    expect(areaBySlug('provinsi', 'sulawesi-tengah')?.code).toBe('72')
    expect(areaBySlug('kabupaten', 'kota-palu')?.code).toBe('7271')
    expect(areaBySlug('provinsi', 'atlantis')).toBeUndefined()
    expect(areaBySlug('indonesia', 'indonesia')?.code).toBe('0')
    expect(areaByCode('provinsi', 72)?.slug).toBe('sulawesi-tengah')
  })
})

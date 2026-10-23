import { describe, expect, it } from 'vitest'
import { fx } from '../../../test/fixtures/load'
import type * as W from '../wire'
import { kabupatenLatest, provincesLatest } from './areas'
import { banners, donations, hospitals, infographics, partners, taskForces, telemedicines } from './content'
import { testPeriods } from './stats'
import { vaccinationSeries, vaccineLocations } from './vaccination'

describe('content normalisers on live fixtures', () => {
  it('hospitals: area ref, bed rows and safe contacts', () => {
    const list = hospitals(fx<W.WireHospital[]>('hospitals'))
    expect(list.length).toBeGreaterThan(5)
    const h = list[0]!
    expect(h.kabupaten?.level).toBe('kabupaten')
    expect(h.beds.length).toBeGreaterThan(0)
    for (const c of list.flatMap((x) => x.contacts)) expect(c.href).toMatch(/^(|https:\/\/|tel:|mailto:)/)
  })

  it('task forces: grouped by a known kabupaten, Banggai first row from the fixture', () => {
    const groups = taskForces(fx<W.WireTaskForceGroup[]>('task-forces'))
    expect(groups.length).toBe(13)
    expect(groups.find((g) => g.kabupaten.code === '7202')?.members[0]?.contacts[0]?.kind).toBe('phone')
  })

  it('banners: banuacoders.com images become null, links stay https', () => {
    const list = banners(fx<W.WireBanner[]>('banners'))
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((b) => b.image === null)).toBe(true)
    expect(list[0]?.href).toMatch(/^https:/)
  })

  it('infographics: images in queue order, links https', () => {
    const wire = fx<W.WireInfographic[]>('infographics')
    const reordered = wire.map((i) => ({ ...i, images: [...i.images].reverse() }))
    expect(infographics(reordered)).toEqual(infographics(wire))
    expect(infographics(wire)[0]?.images[0]).toMatch(/^https:\/\/i\.ibb\.co\//)
  })

  it('infographics: an unusable image URL is dropped', () => {
    const base = fx<W.WireInfographic[]>('infographics')[0]!
    const out = infographics([{ ...base, images: [{ id: 1, queue: 1, image_url: 'x.jpg' }, { id: 2, queue: 2, image_url: 'https://i.ibb.co/a.jpg' }] }])
    expect(out[0]?.images).toEqual(['https://i.ibb.co/a.jpg'])
  })

  it('donations: relative image is null, account numbers stay text, contacts are built', () => {
    const list = donations(fx<W.WireDonation[]>('donations'))
    expect(list.length).toBe(8)
    expect(list.find((d) => d.id === 2)?.image).toBeNull()
    const acc = list.flatMap((d) => d.accounts)[0]!
    expect(typeof acc.number).toBe('string')
    expect(list.find((d) => d.id === 2)?.contacts.map((c) => c.kind)).toContain('whatsapp')
  })

  it('telemedicines and partners', () => {
    const t = telemedicines(fx<W.WireTelemedicine[]>('telemedicines'))
    expect(t[0]).toMatchObject({ name: 'dr. Evans Suryani', free: true })
    expect(t[0]?.schedules[0]).toEqual({ days: 'Senin-Jumat', hours: '07:00-20:00', tz: 'WIB' })
    const p = partners(fx<W.WirePartner[]>('partners'))
    expect(p[0]).toEqual({ id: 1, name: 'Detexi', href: 'https://detexi.id/', inFooter: true })
    expect(p.filter((x) => x.inFooter).length).toBeGreaterThan(0)
  })

  it('provinces latest: 34 rows keyed to the slug table', () => {
    const list = provincesLatest(fx<W.WireProvince[]>('provinces'))
    expect(list).toHaveLength(34)
    const aceh = list.find((l) => l.area.slug === 'aceh')!
    expect(aceh.latest.date).toBe('2024-01-14')
    expect(aceh.latest.cumulative.positive).toBe(45092)
  })

  it('kabupaten latest from the include_latest_case shape skips regencies with null', () => {
    const list = kabupatenLatest(fx<W.WireRegency[]>('regencies-with-latest.synthetic'))
    expect(list).toHaveLength(1)
    expect(list[0]?.area.slug).toBe('kota-palu')
  })

  it('vaccination: ascending by date, five groups, coverage kept raw', () => {
    const rows = vaccinationSeries(fx<W.WireVaccinationDay[]>('vaccination-province'))
    expect(rows[0]!.date < rows.at(-1)!.date).toBe(true)
    expect(rows.every((r, i) => i === 0 || r.date > rows[i - 1]!.date)).toBe(true)
    expect(rows[0]?.groups.map((g) => g.key)).toEqual(['health_worker', 'public_officer', 'elderly', 'public', 'teenager'])
    expect(Math.max(...rows.flatMap((r) => r.groups.map((g) => g.coverage.dose1)))).toBeGreaterThan(100) // C1: can exceed 100
  })

  it('vaccine locations map kabupaten and notes', () => {
    const l = vaccineLocations(fx<W.WireVaccineLocation[]>('vaccine-locations'))
    expect(l[0]).toMatchObject({ id: 1, hours: '08:00 - 12:00', firstDose: false, notes: null })
    expect(l[0]?.kabupaten?.slug).toBe('kota-palu')
  })

  it('tests: only pcr and rdt, ascending', () => {
    const p = testPeriods(fx<W.WireTestRow[]>('tests'))
    expect(p.every((x) => x.type === 'pcr' || x.type === 'rdt')).toBe(true)
    expect(p.every((x, i) => i === 0 || x.from >= p[i - 1]!.from)).toBe(true)
  })
})

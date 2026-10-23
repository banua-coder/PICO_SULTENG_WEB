// One named test per C1 quirk (Q1 to Q10), using rows recorded from the live API.
import { describe, expect, it } from 'vitest'
import { INDONESIA, SULTENG, areaByCode } from '@/app/areas'
import { fx } from '../../../test/fixtures/load'
import type { AreaRef } from '../types'
import type { WireNationalCase, WireProvinceCase, WireRegencyCase } from '../wire'
import { makeContact } from './contacts'
import { resolveImage } from './images'
import { nationalSeries, provinceSeries, regencySeries, rtPoint } from './series'
import { genderSnapshot } from './stats'
import type { WireGenderLatest } from '../wire'

const PALU = areaByCode('kabupaten', 7271) as AreaRef
const ascending = (dates: string[]) => dates.every((d, i) => i === 0 || d > dates[i - 1]!)

describe('Q1: day is not a date, rows are keyed by calendar date', () => {
  const national = nationalSeries(INDONESIA, fx<WireNationalCase[]>('national'))

  it('national day 1414 (2023-07-22) sits at its date position, not at the end', () => {
    const wire = fx<WireNationalCase[]>('national')
    expect(wire.find((w) => w.day === 1414)?.date.slice(0, 10)).toBe('2023-07-22') // the live quirk is in the fixture
    const dates = national.rows.map((r) => r.date)
    expect(dates).toContain('2023-07-22')
    expect(dates.at(-1)).toBe('2024-01-14')
    expect(ascending(dates)).toBe(true)
  })

  it('never reads `day`: shuffled and renumbered rows give the same series', () => {
    const wire = fx<WireNationalCase[]>('national')
    const scrambled = wire.map((w, i) => ({ ...w, day: (i * 7919) % 5000 })).reverse()
    expect(nationalSeries(INDONESIA, scrambled).rows).toEqual(national.rows)
  })

  it('a timestamp with a time of day keeps its calendar date (+07:00 is never re-zoned)', () => {
    const row = { ...fx<WireNationalCase[]>('national')[0]!, date: '2021-07-01T16:14:07+07:00' }
    expect(nationalSeries(INDONESIA, [row]).rows[0]?.date).toBe('2021-07-01')
    const late = { ...row, date: '2021-07-01T23:59:59+07:00' }
    expect(nationalSeries(INDONESIA, [late]).rows[0]?.date).toBe('2021-07-01')
  })

  it('duplicate dates collapse to one row, the last one served wins', () => {
    const base = fx<WireNationalCase[]>('national')[0]!
    const a = { ...base, date: '2021-01-01T00:00:00+07:00', daily: { ...base.daily, positive: 1 } }
    const b = { ...base, date: '2021-01-01T10:00:00+07:00', daily: { ...base.daily, positive: 2 } }
    const s = nationalSeries(INDONESIA, [a, b])
    expect(s.rows).toHaveLength(1)
    expect(s.rows[0]?.daily.positive).toBe(2)
  })
})

describe('Q2: series order differs per endpoint and province sort is ignored', () => {
  it('province rows served newest first come out ascending, unique', () => {
    const wire = fx<WireProvinceCase[]>('province-72-cases')
    expect(wire[0]!.date > wire.at(-1)!.date).toBe(true) // served desc
    const s = provinceSeries(SULTENG, wire)
    expect(ascending(s.rows.map((r) => r.date))).toBe(true)
    expect(s.first).toBe('2020-03-02')
    expect(s.last).toBe('2024-01-14')
  })

  it('regency rows served by `day` come out by date', () => {
    const s = regencySeries(PALU, fx<WireRegencyCase[]>('regency-7271-cases'))
    expect(ascending(s.rows.map((r) => r.date))).toBe(true)
  })
})

describe('Q3: the web sends no date or sort parameters', () => {
  it('series URLs are plain paths (see useResources.test for the live request log)', async () => {
    const { seriesPath } = await import('../useSeries')
    for (const a of [INDONESIA, SULTENG, PALU]) expect(seriesPath(a)).not.toMatch(/sort|start_date|end_date/)
  })
})

describe('Q4: gender has no date', () => {
  it('asOf is null and age buckets keep their keys and bilingual labels', () => {
    const g = genderSnapshot(fx<WireGenderLatest>('gender-latest'))
    expect(g.asOf).toBeNull()
    expect(g.positive.male.ages.map((a) => a.key)).toEqual(['0_14', '15_19', '20_24', '25_49', '50_54', '55_plus'])
    expect(g.positive.male.ages[0]?.label.en).toBe('0 to 14 years')
    expect(g.positive.female.total).toBeGreaterThan(0)
  })
})

describe('Q5: zero means unknown for province ODP/PDP', () => {
  const row = (date: string, odp: [number, number, number], pdp: [number, number, number]): WireProvinceCase => {
    const base = fx<WireProvinceCase[]>('province-72-cases')[0]!
    const [a, f, t] = odp
    const [pa, pf, pt] = pdp
    return {
      ...base,
      date: `${date}T00:00:00+07:00`,
      daily: { ...base.daily, odp: { active: a, finished: f }, pdp: { active: pa, finished: pf } },
      cumulative: { ...base.cumulative, odp: { active: a, finished: f, total: t }, pdp: { active: pa, finished: pf, total: pt } },
    }
  }

  it('dates after the last non-zero ODP/PDP are null, earlier dates keep numbers (even zeros)', () => {
    const s = provinceSeries(SULTENG, [
      row('2021-01-01', [0, 0, 0], [0, 0, 0]), // before the cut-off: a real zero
      row('2022-05-08', [3, 4, 7], [1, 1, 2]), // last non-zero
      row('2022-05-09', [0, 0, 0], [0, 0, 0]),
      row('2024-01-14', [0, 0, 0], [0, 0, 0]),
    ])
    const by = Object.fromEntries(s.rows.map((r) => [r.date, r]))
    expect(by['2021-01-01']?.odp).toEqual({ active: 0, finished: 0, total: 0 })
    expect(by['2022-05-08']?.odp).toEqual({ active: 3, finished: 4, total: 7 })
    expect(by['2022-05-09']?.odp).toBeNull()
    expect(by['2022-05-09']?.pdp).toBeNull()
    expect(by['2024-01-14']?.odp).toBeNull()
  })

  it('a province that never had ODP/PDP numbers gets null everywhere', () => {
    const s = provinceSeries(SULTENG, [row('2021-01-01', [0, 0, 0], [0, 0, 0])])
    expect(s.rows[0]?.odp).toBeNull()
  })

  it('national rows have no ODP/PDP at all', () => {
    const s = nationalSeries(INDONESIA, fx<WireNationalCase[]>('national'))
    expect(s.rows.every((r) => r.odp === null && r.pdp === null)).toBe(true)
  })

  it('kabupaten rows keep the API nulls, and `active` is null, never computed (C2 invariant 4)', () => {
    const s = regencySeries(PALU, fx<WireRegencyCase[]>('regency-7271-cases'))
    expect(s.rows.every((r) => r.daily.active === null && r.cumulative.active === null)).toBe(true)
    expect(s.rows[0]?.odp).toBeNull()
  })
})

describe('Q6: Rt is a full triple or null', () => {
  it('maps a full triple, and null stays null (never 0)', () => {
    expect(rtPoint(0.95, 0.81, 1.1)).toEqual({ value: 0.95, lower: 0.81, upper: 1.1 })
    expect(rtPoint(null, null, null)).toBeNull()
  })
  it('a partial triple is null', () => {
    expect(rtPoint(0.9, null, 1.2)).toBeNull()
    expect(rtPoint(null, 0.8, 1.2)).toBeNull()
  })
  it('an all-zero triple (a 0 that stands for missing) is null', () => {
    expect(rtPoint(0, 0, 0)).toBeNull()
  })
  it('national Rt is null on the first day and a triple somewhere in the fixture', () => {
    const s = nationalSeries(INDONESIA, fx<WireNationalCase[]>('national'))
    expect(s.rows[0]?.rt).toBeNull()
    const triples = s.rows.flatMap((r) => (r.rt ? [r.rt] : []))
    expect(triples.length).toBeGreaterThan(0)
    for (const t of triples) expect(t.lower).toBeLessThanOrEqual(t.upper)
  })
  it('regency Rt comes from the flat rt, rt_lower and rt_upper', () => {
    const base = fx<WireRegencyCase[]>('regency-7271-cases')[0]!
    const s = regencySeries(PALU, [{ ...base, rt: 1.1, rt_lower: 0.9, rt_upper: 1.3 }])
    expect(s.rows[0]?.rt).toEqual({ value: 1.1, lower: 0.9, upper: 1.3 })
  })
})

describe('Q7: image resolver', () => {
  it('passes absolute https URLs on other hosts, including i.ibb.co', () => {
    expect(resolveImage('https://i.ibb.co/mq0ZH12/1.jpg')).toBe('https://i.ibb.co/mq0ZH12/1.jpg')
  })
  it('a banner on the expired banuacoders.com is null', () => {
    expect(resolveImage('https://banuacoders.com/corona/assets/banners/July2021/x.png')).toBeNull()
    expect(resolveImage('https://www.banuacoders.com/a.png')).toBeNull()
  })
  it('a relative donation image and a bare partner file name are null', () => {
    expect(resolveImage('donations/July2021/eihpXTSucqIThKxLYGeT.jpg')).toBeNull()
    expect(resolveImage('detexi.png')).toBeNull()
    expect(resolveImage('/storage/x.png')).toBeNull()
  })
  it('http, junk and empty are null', () => {
    expect(resolveImage('http://i.ibb.co/a.jpg')).toBeNull()
    expect(resolveImage('javascript:alert(1)')).toBeNull()
    expect(resolveImage('')).toBeNull()
    expect(resolveImage(null)).toBeNull()
  })
})

describe('Q8: names', () => {
  it('7208 displays as Parigi Moutong and 7206 as Tolitoli, while the API says Mautong and Toli-Toli', () => {
    expect(areaByCode('kabupaten', 7208)).toMatchObject({ name: 'Parigi Moutong', slug: 'parigi-moutong' })
    expect(areaByCode('kabupaten', 7206)).toMatchObject({ name: 'Tolitoli', slug: 'tolitoli' })
  })
})

describe('Q9: unknown province', () => {
  it('an empty list (the old API answer) gives an empty series, not a crash', () => {
    const s = provinceSeries(SULTENG, [])
    expect(s).toEqual({ area: SULTENG, rows: [], first: '', last: '' })
  })
})

describe('Q10: percentages are floats', () => {
  it('the domain row carries raw counts and Rt only, so rounding stays in useFormat', () => {
    const s = provinceSeries(SULTENG, fx<WireProvinceCase[]>('province-72-cases'))
    expect(Object.keys(s.rows[0]!).sort()).toEqual(['cumulative', 'daily', 'date', 'odp', 'pdp', 'rt'])
  })
})

describe('contacts (hrefs are https:, tel: or mailto: only)', () => {
  it('phone', () => expect(makeContact(2, '0812 1375-6763')).toEqual({ kind: 'phone', label: '0812 1375-6763', href: 'tel:081213756763' }))
  it('email', () => expect(makeContact(1, 'a@b.go.id')?.href).toBe('mailto:a@b.go.id'))
  it('a bad email gets no link', () => expect(makeContact(1, 'not an email')?.href).toBe(''))
  it('fax is text', () => expect(makeContact(3, '0451-123')).toMatchObject({ kind: 'fax', href: '' }))
  it('website gets https, and javascript: is refused', () => {
    expect(makeContact(4, 'www.dinkes.go.id')?.href).toBe('https://www.dinkes.go.id/')
    expect(makeContact(4, 'http://x.id/a')?.href).toBe('https://x.id/a')
    expect(makeContact(4, 'javascript:alert(1)')?.href).toBe('')
  })
  it('whatsapp keeps digits only, and a leading 0 becomes 62', () => {
    expect(makeContact(5, '6285256087018')?.href).toBe('https://api.whatsapp.com/send?phone=6285256087018')
    expect(makeContact(5, '+62 852-5608-7018')?.href).toBe('https://api.whatsapp.com/send?phone=6285256087018')
    expect(makeContact(5, '085256087018')?.href).toBe('https://api.whatsapp.com/send?phone=6285256087018')
  })
  it('telegram, instagram, twitter and line handles are encoded under the fixed base', () => {
    expect(makeContact(6, '@evans')?.href).toBe('https://t.me/evans')
    expect(makeContact(8, 'palu kota')?.href).toBe('https://instagram.com/palu%20kota')
    expect(makeContact(7, 'x')?.href).toBe('https://twitter.com/x')
    expect(makeContact(9, '@abc')?.href).toBe('https://line.me/R/ti/p/abc')
  })
  it('an unknown type or an empty value gives no contact', () => {
    expect(makeContact(99, 'x')).toBeNull()
    expect(makeContact(2, '  ')).toBeNull()
  })
})

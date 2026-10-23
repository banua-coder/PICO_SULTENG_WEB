import { describe, expect, it } from 'vitest'
import { vaccinationSeries, vaccineLocations } from '@/api/normalize/vaccination'
import { fx } from '../../../test/fixtures/load'
import { doseSeries, groupBars, groupLocations, kabupatenWithSites, lastDay, overTarget, parseScope } from './useVaksin'

const sul = vaccinationSeries(fx('vaccination-province'))
const nat = vaccinationSeries(fx('vaccination-national'))
const locs = vaccineLocations(fx('vaccine-locations'))

describe('vaccination logic', () => {
  it('scope: only "indonesia" is Indonesia', () => {
    expect([parseScope('indonesia'), parseScope(undefined), parseScope('x'), parseScope(['indonesia'])]).toEqual(['indonesia', 'sulawesi-tengah', 'sulawesi-tengah', 'indonesia'])
  })
  it('Sulawesi Tengah on 25 March 2022: dose 1 85.55 %, dose 2 53.63 %', () => {
    const d = lastDay(sul)!
    expect(d.date).toBe('2022-03-25')
    expect([d.total.coverage.dose1, d.total.coverage.dose2]).toEqual([85.55, 53.63])
    expect(Math.round((d.total.cumulative.dose1 / d.target) * 10000) / 100).toBe(85.55)
    expect(lastDay(nat)?.date).toBe('2022-03-25')
  })
  it('health workers passed their dose 1 and dose 2 targets: listed as over target, the bar value stays a plain number', () => {
    const d = lastDay(sul)!
    const over = overTarget(d)
    expect(over.map((o) => `${o.key}:${o.dose}`)).toContain('health_worker:dose1')
    expect(over.find((o) => o.key === 'health_worker' && o.dose === 'dose1')!.coverage).toBe(111.23)
    const bars = groupBars(d, 'dose1', (k) => k, (n) => `${n}%`)
    expect(bars.map((b) => b.key)).toEqual(['health_worker', 'public_officer', 'elderly', 'public', 'teenager'])
    expect(bars[0]!.value).toBe(111.23)
    expect(bars[0]!.label).toBe('health_worker (111.23%)')
  })
  it('dose series: two forms, solid and dashed, ascending dates', () => {
    const [d1, d2] = doseSeries(sul, { dose1: 'Dosis 1', dose2: 'Dosis 2' })
    expect(d1!.form!.dash).toBe('none')
    expect(d2!.form!.dash).not.toBe('none')
    expect(d1!.form!.shape).not.toBe(d2!.form!.shape)
    expect(d1!.points.at(-1)).toEqual({ x: '2022-03-25', y: 1827303 })
    const xs = d1!.points.map((p) => p.x)
    expect([...xs].sort()).toEqual(xs)
  })
  it('locations: grouped by kabupaten by name, filtered, a site without a kabupaten goes last and only shows under "all"', () => {
    expect(locs).toHaveLength(36)
    const all = groupLocations(locs, null, 'Tidak diketahui')
    expect(all.reduce((n, g) => n + g.sites.length, 0)).toBe(36)
    const names = all.filter((g) => g.code !== 'unknown').map((g) => g.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'id')))
    const palu = kabupatenWithSites(locs).find((k) => k.code === '7271')!
    const only = groupLocations(locs, palu, 'x')
    expect(only).toHaveLength(1)
    expect(only[0]!.sites.every((s) => s.kabupaten?.code === '7271')).toBe(true)
    const orphan = [{ ...locs[0]!, kabupaten: null }]
    expect(groupLocations(orphan, null, 'Tidak diketahui')[0]!.name).toBe('Tidak diketahui')
    expect(groupLocations(orphan, palu, 'x')).toEqual([])
  })
})

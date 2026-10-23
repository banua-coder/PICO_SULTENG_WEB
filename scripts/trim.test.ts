import { describe, expect, it } from 'vitest'
import { trimEnvelope, trimSeries } from './trim'

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ day: i + 1, date: `d${i + 1}` }))

describe('trimSeries', () => {
  it('returns short series untouched', () => {
    expect(trimSeries(rows(100))).toHaveLength(100)
  })
  it('keeps the first 60 and last 60', () => {
    const out = trimSeries(rows(1414))
    expect(out).toHaveLength(120)
    expect(out[0]?.day).toBe(1)
    expect(out.at(-1)?.day).toBe(1414)
  })
  it('keeps the out-of-order row (Q1: day 1414 sits mid-series)', () => {
    const r = rows(1414).slice(0, 1393) // days 1..1393 in date order
    r.splice(1390, 0, { day: 1414, date: '2023-07-22' }) // misplaced row
    const out = trimSeries(r)
    expect(out.some((x) => x.day === 1414)).toBe(true)
    expect(out.length).toBeLessThanOrEqual(126)
  })
  it('prefers the biggest jump when many rows are out of order', () => {
    const r = rows(1000)
    for (let i = 100; i < 400; i += 3) r[i] = { ...r[i]!, day: r[i]!.day + 2 } // many small jumps
    r[700] = { day: 5000, date: 'odd' } // one huge jump
    expect(trimSeries(r).some((x) => x.day === 5000)).toBe(true)
  })
})

describe('trimEnvelope', () => {
  it('trims V4 plain lists and V2/V3 paginated lists, keeping the envelope', () => {
    const v4 = trimEnvelope({ status: 'success', data: rows(300) }, 'series') as { status: string; data: unknown[] }
    expect(v4.status).toBe('success')
    expect(v4.data).toHaveLength(120)
    const v2 = trimEnvelope({ status: 'success', data: { data: rows(300), pagination: { total: 300 } } }, 5) as {
      data: { data: unknown[]; pagination: unknown }
    }
    expect(v2.data.data).toHaveLength(5)
    expect(v2.data.pagination).toEqual({ total: 300 })
  })
  it('leaves V1 objects alone', () => {
    const body = { status: 'success', data: { id: 1 } }
    expect(trimEnvelope(body, 'series')).toBe(body)
  })
})

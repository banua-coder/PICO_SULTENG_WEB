import { describe, expect, it } from 'vitest'
import national from '../../test/fixtures/api/national.json'
import { unwrap } from './envelope'

type Row = { day: number; date: string }

// Guards the recorded fixture: it must keep the live quirk rows the data-layer tests rely on.
describe('recorded fixtures', () => {
  it('national fixture unwraps and holds the out-of-order day 1414 row (Q1)', () => {
    const rows = unwrap<Row[]>(national)
    expect(rows.length).toBeGreaterThan(100)
    expect(rows.find((r) => r.day === 1414)?.date.slice(0, 10)).toBe('2023-07-22')
    expect(rows[0]?.date.slice(0, 10)).toBe('2020-03-02')
    expect(rows.at(-1)?.date.slice(0, 10)).toBe('2024-01-14')
  })
})

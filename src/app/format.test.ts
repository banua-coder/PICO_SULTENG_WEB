import { describe, expect, it } from 'vitest'
import { createFormatter } from './format'

const strings = {
  id: { notAvailable: 'tidak tersedia', rangeJoin: 'sampai' },
  en: { notAvailable: 'not available', rangeJoin: 'to' },
}
const id = createFormatter('id', strings.id)
const en = createFormatter('en', strings.en)

describe('num', () => {
  it('groups by locale (spec 13 acceptance)', () => {
    expect(id.num(1234567)).toBe('1.234.567')
    expect(en.num(1234567)).toBe('1,234,567')
  })
  it('groups four-digit numbers too', () => {
    expect(id.num(1414)).toBe('1.414')
    expect(en.num(1414)).toBe('1,414')
  })
  it('rounds to whole numbers by default and takes fixed digits', () => {
    expect(id.num(2.6)).toBe('3')
    expect(id.num(0.95, 2)).toBe('0,95')
    expect(en.num(0.9, 2)).toBe('0.90')
  })
  it('keeps the minus sign readable', () => {
    expect(id.num(-5)).toMatch(/^[-−]5$/)
  })
})

describe('pct', () => {
  it('formats a percent value (not a fraction) with 1 digit by default', () => {
    expect(id.pct(97.23331342157387)).toBe('97,2%')
    expect(en.pct(97.23331342157387)).toBe('97.2%')
    expect(id.pct(100, 0)).toBe('100%')
    expect(en.pct(100.36, 2)).toBe('100.36%')
  })
})

describe('date', () => {
  it('long: 14 Januari 2024 / 14 January 2024 (spec 13 acceptance)', () => {
    expect(id.date('2024-01-14')).toBe('14 Januari 2024')
    expect(en.date('2024-01-14')).toBe('14 January 2024')
  })
  it('short', () => {
    expect(id.date('2024-01-14', 'short')).toBe('14 Jan 2024')
    expect(en.date('2024-01-14', 'short')).toBe('14 Jan 2024')
  })
  it('never shifts the calendar day, whatever the machine time zone', () => {
    expect(id.date('2020-03-02')).toBe('2 Maret 2020')
    expect(en.date('2023-12-31')).toBe('31 December 2023')
    expect(en.date('2024-01-01')).toBe('1 January 2024')
  })
  it('accepts a full API timestamp by its first 10 characters (C1 Q1)', () => {
    expect(id.date('2021-07-01T16:14:07+07:00')).toBe('1 Juli 2021')
  })
  it('throws on a value that is not a date, so a bug shows up in tests and not as "Invalid Date"', () => {
    expect(() => id.date('soon')).toThrow()
  })
})

describe('month and year (chart ticks)', () => {
  it('id and en', () => {
    expect(id.month('2021-01-01')).toBe('Jan 2021')
    expect(id.month('2021-08-17')).toBe('Agu 2021')
    expect(en.month('2021-08-17')).toBe('Aug 2021')
    expect(id.year('2023-12-31')).toBe('2023')
  })
})

describe('range', () => {
  it('joins two dates', () => {
    expect(id.range('2021-07-01', '2021-07-31')).toBe('1 Juli 2021 sampai 31 Juli 2021')
    expect(en.range('2021-07-01', '2021-07-31')).toBe('1 July 2021 to 31 July 2021')
  })
  it('collapses an equal start and end to one date', () => {
    expect(id.range('2024-01-14', '2024-01-14')).toBe('14 Januari 2024')
  })
})

describe('nullable', () => {
  it('null and undefined give the localized "not available", never 0 (spec 13 acceptance)', () => {
    expect(id.nullable(null, id.num)).toBe('tidak tersedia')
    expect(en.nullable(undefined, en.num)).toBe('not available')
  })
  it('0 is a real value and is formatted', () => {
    expect(id.nullable(0, id.num)).toBe('0')
  })
  it('passes the value to the formatter', () => {
    expect(en.nullable(1234, en.num)).toBe('1,234')
  })
})

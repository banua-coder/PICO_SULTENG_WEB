import type { Locale } from './locale'

// Explicit locales and time zone so Node (prerender) and the browser print the same text (ADR-0096 R1).
const INTL_LOCALE: Record<Locale, string> = { id: 'id-ID', en: 'en-GB' }
const TIME_ZONE = 'Asia/Jakarta'

export type FormatStrings = { notAvailable: string; rangeJoin: string }
export type DateStyle = 'long' | 'short'

/** Pure formatter for one locale. `useFormat()` wraps it with the reactive locale and messages. */
export function createFormatter(locale: Locale, strings: FormatStrings) {
  const tag = INTL_LOCALE[locale]
  const numbers = new Map<number, Intl.NumberFormat>()
  const numberFmt = (digits: number) => {
    let f = numbers.get(digits)
    if (!f) numbers.set(digits, (f = new Intl.NumberFormat(tag, { minimumFractionDigits: digits, maximumFractionDigits: digits })))
    return f
  }
  const dates: Record<DateStyle, Intl.DateTimeFormat> = {
    long: new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric', timeZone: TIME_ZONE }),
    short: new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIME_ZONE }),
  }
  const monthFmt = new Intl.DateTimeFormat(tag, { month: 'short', year: 'numeric', timeZone: TIME_ZONE })
  const yearFmt = new Intl.DateTimeFormat(tag, { year: 'numeric', timeZone: TIME_ZONE })

  const num = (n: number, digits = 0): string => numberFmt(digits).format(n)

  /** `n` is a percent value (97.2), not a fraction. */
  const pct = (n: number, digits = 1): string => `${num(n, digits)}%`

  /** `iso` is 'YYYY-MM-DD' or a longer API timestamp (only the first 10 characters count). */
  const date = (iso: string, style: DateStyle = 'long'): string => {
    const day = iso.slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`not an ISO date: ${iso}`)
    // pinned to the API's +07:00 and formatted in Asia/Jakarta, so the calendar day never moves
    const d = new Date(`${day}T12:00:00+07:00`)
    if (Number.isNaN(d.getTime())) throw new Error(`not an ISO date: ${iso}`)
    return dates[style].format(d)
  }

  const parse = (iso: string) => {
    const d = new Date(`${iso.slice(0, 10)}T12:00:00+07:00`)
    if (Number.isNaN(d.getTime())) throw new Error(`not an ISO date: ${iso}`)
    return d
  }
  /** 'Jan 2021', for chart ticks */
  const month = (iso: string): string => monthFmt.format(parse(iso))
  /** '2021', for chart ticks */
  const year = (iso: string): string => yearFmt.format(parse(iso))

  const range = (from: string, to: string): string =>
    from.slice(0, 10) === to.slice(0, 10) ? date(from) : `${date(from)} ${strings.rangeJoin} ${date(to)}`

  /** `null` is "not available", never 0. */
  const nullable = <T>(v: T | null | undefined, fmt: (v: T) => string): string => (v === null || v === undefined ? strings.notAvailable : fmt(v))

  return { num, pct, date, month, year, range, nullable }
}

export type Formatter = ReturnType<typeof createFormatter>

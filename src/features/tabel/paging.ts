import type { DailyRow, IsoDate } from '@/api/types'

export const PAGE_SIZE = 50

export const pageCount = (total: number, size = PAGE_SIZE) => Math.max(1, Math.ceil(total / size))
export const clampPage = (page: number, total: number, size = PAGE_SIZE) => Math.min(pageCount(total, size), Math.max(1, Math.floor(page) || 1))

/** ?hal: an integer of 1 or more, junk gives 1. */
export function parsePage(v: unknown): number {
  const s = Array.isArray(v) ? v[0] : v
  const n = typeof s === 'string' && /^\d+$/.test(s) ? Number(s) : 1
  return n >= 1 ? n : 1
}

export const slicePage = <T,>(rows: T[], page: number, size = PAGE_SIZE): T[] => rows.slice((page - 1) * size, page * size)

/** The page that holds `date` in rows ordered newest first. A date after the newest row gives page 1, before the oldest the last page. */
export function pageOfDate(rowsDesc: DailyRow[], date: IsoDate, size = PAGE_SIZE): number {
  if (rowsDesc.length === 0) return 1
  const i = rowsDesc.findIndex((r) => r.date <= date)
  return Math.floor((i === -1 ? rowsDesc.length - 1 : i) / size) + 1
}

/** Page buttons to show: first, last, and two on each side of the current one. `null` is a gap. */
export function pageNumbers(current: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, current - 2, current - 1, current, current + 1, current + 2].filter((n) => n >= 1 && n <= pages))
  const sorted = [...keep].sort((a, b) => a - b)
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1]! > 1 ? [null, n] : [n]))
}

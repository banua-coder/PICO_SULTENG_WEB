/** Fixture trimming, kept pure so it is unit tested. */
export const KEEP_DATES = ['2022-05-07', '2022-05-08', '2022-05-09', '2023-06-24', '2023-07-09', '2023-07-10', '2021-07-30', '2021-07-31', '2021-08-01'] as const

type Row = Record<string, unknown>

/**
 * Keep the first `edge` and last `edge` rows (in served order) plus rows where `day` jumps by
 * more than 1, which are the out-of-order rows of C1 quirk Q1. At most `maxExtra` extras, biggest jumps first.
 */
export function trimSeries<T extends Row>(rows: T[], edge = 60, maxExtra = 6, keepDates: readonly string[] = KEEP_DATES): T[] {
  if (rows.length <= edge * 2) return rows
  const keep = new Set<number>()
  // dates the page logic and its tests rely on: the ODP/PDP cut-off, the end of Rt, a month inside the Delta wave
  rows.forEach((r, i) => {
    if (typeof r.date === 'string' && keepDates.includes(r.date.slice(0, 10))) keep.add(i)
  })
  for (let i = 0; i < edge; i++) keep.add(i).add(rows.length - 1 - i)
  const extras: { i: number; jump: number }[] = []
  for (let i = edge; i < rows.length - edge; i++) {
    const day = (r: T | undefined) => (typeof r?.day === 'number' ? r.day : undefined)
    const prev = day(rows[i - 1])
    const cur = day(rows[i])
    const next = day(rows[i + 1])
    if (cur === undefined) continue
    const jump = Math.max(prev === undefined ? 0 : Math.abs(cur - prev), next === undefined ? 0 : Math.abs(next - cur))
    if (jump > 1) extras.push({ i, jump })
  }
  // the biggest jumps are the misplaced rows (national day 1414 dated 2023-07-22)
  extras.sort((a, b) => b.jump - a.jump).slice(0, maxExtra).forEach(({ i }) => keep.add(i))
  return rows.filter((_, i) => keep.has(i))
}

/** Trim the array inside a raw C1 envelope (V2/V3 `data.data` or V4 `data`), keeping the envelope. */
export function trimEnvelope(body: unknown, trim: 'series' | number | undefined): unknown {
  if (trim === undefined || typeof body !== 'object' || body === null) return body
  const b = body as { data?: unknown }
  const cut = (rows: Row[]) => (trim === 'series' ? trimSeries(rows) : rows.slice(0, trim))
  if (Array.isArray(b.data)) return { ...b, data: cut(b.data as Row[]) }
  const inner = b.data as { data?: unknown } | undefined
  if (inner && Array.isArray(inner.data)) return { ...b, data: { ...inner, data: cut(inner.data as Row[]) } }
  return body
}

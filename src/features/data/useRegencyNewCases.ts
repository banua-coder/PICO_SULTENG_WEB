import type { DailyRow } from '@/api/types'
import { fetchStatic } from '@/api/client'
import { useResource } from '@/api/resource'
import type { NewCaseItem, NewCasesDay } from '@/app/newCases'
import type { BarDatum } from '@/components/charts/types'

export const NEWCASES_URL = `${import.meta.env?.BASE_URL ?? '/'}data/kabupaten-newcases.json`

/** The build-time cut of "new cases per kabupaten/kota on the last reporting day". Client only (the section fills in after hydration). */
export const useKabupatenNewCases = () =>
  useResource<NewCasesDay | null>(NEWCASES_URL, (signal) => fetchStatic<NewCasesDay | null>(NEWCASES_URL, { signal }), { series: true })

/** Horizontal bars of one metric, largest first (ties by name); a missing number stays a bar with no value, never 0. */
export function newCaseBars(items: NewCaseItem[], key: 'positive' | 'recovered' | 'deceased'): BarDatum[] {
  return [...items]
    .sort((a, b) => (b[key] ?? -1) - (a[key] ?? -1) || a.name.localeCompare(b.name, 'id'))
    .map((i) => ({ key: i.code, label: i.name, value: i[key], role: key }))
}

/**
 * The legacy pie as bars with the same numbers: how the cumulative positives split into still in care (Dirawat), Sembuh and Meninggal on
 * one day. A kabupaten has no Dirawat (C2), so its share is of the two it has. Labels carry count and share, so colour is never the only cue.
 */
export function shareBars(row: DailyRow, labels: { active: string; recovered: string; deceased: string }, pct: (n: number) => string, num: (n: number) => string): BarDatum[] {
  const c = row.cumulative
  const parts: { key: 'active' | 'recovered' | 'deceased'; label: string; value: number | null }[] = [
    { key: 'active', label: labels.active, value: c.active },
    { key: 'recovered', label: labels.recovered, value: c.recovered },
    { key: 'deceased', label: labels.deceased, value: c.deceased },
  ]
  const known = parts.filter((p) => p.value !== null)
  const total = known.reduce((s, p) => s + (p.value as number), 0)
  return parts.map((p) => ({
    key: p.key,
    label: p.value === null || total <= 0 ? p.label : `${p.label} (${num(p.value)}; ${pct((p.value / total) * 100)})`,
    value: p.value,
    role: p.key === 'active' ? 'active' : p.key,
  }))
}

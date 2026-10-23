import type { AreaRef, Doses, IsoDate, VaccinationDay, VaccinationGroupKey, VaccineLocation } from '@/api/types'
import type { BarDatum, LineSeries, SeriesForm } from '@/components/charts/types'

export type Scope = 'indonesia' | 'sulawesi-tengah'

/** ?wilayah: "indonesia" or anything else (the default, Sulawesi Tengah). */
export const parseScope = (v: unknown): Scope => ((Array.isArray(v) ? v[0] : v) === 'indonesia' ? 'indonesia' : 'sulawesi-tengah')

export const lastDay = (days: VaccinationDay[]): VaccinationDay | undefined => days.at(-1)

/** The source's coverage is a percent of the group's target and can pass 100. */
export const OVER = 100

export type GroupRow = { key: VaccinationGroupKey; coverage: Doses }

/** Coverage of both doses for each group on a day, in the page's group order. */
export const groupRows = (d: VaccinationDay): GroupRow[] => d.groups.map((g) => ({ key: g.key, coverage: g.coverage }))

/** Bars for one dose. The label carries the exact percent (the bar end shows the rounded one). */
export function groupBars(d: VaccinationDay, dose: 'dose1' | 'dose2', name: (k: VaccinationGroupKey) => string, pct: (n: number) => string): BarDatum[] {
  return d.groups.map((g) => ({ key: g.key, label: `${name(g.key)} (${pct(g.coverage[dose])})`, value: g.coverage[dose], role: 'positive' }))
}

/** Groups and doses whose coverage is above the target, for the over-target note. */
export function overTarget(d: VaccinationDay): { key: VaccinationGroupKey; dose: 'dose1' | 'dose2'; coverage: number }[] {
  return d.groups.flatMap((g) => (['dose1', 'dose2'] as const).flatMap((dose) => (g.coverage[dose] > OVER ? [{ key: g.key, dose, coverage: g.coverage[dose] }] : [])))
}

// Doses are not case roles: dose 1 is a solid primary line with a square, dose 2 a dashed indigo line with a diamond (O-10 default).
export const DOSE_FORMS: Record<'dose1' | 'dose2', SeriesForm> = {
  dose1: { color: 'var(--pico-primary)', dash: 'none', shape: 'positive' },
  dose2: { color: 'var(--pico-indigo)', dash: '6 4', shape: 'recovered' },
}

/** Cumulative injections per dose over the whole series. */
export function doseSeries(days: VaccinationDay[], labels: { dose1: string; dose2: string }): LineSeries[] {
  const line = (dose: 'dose1' | 'dose2'): LineSeries => ({ id: dose, role: DOSE_FORMS[dose].shape, label: labels[dose], form: DOSE_FORMS[dose], points: days.map((d) => ({ x: d.date, y: d.total.cumulative[dose] })) })
  return [line('dose1'), line('dose2')]
}

export type LocationGroup = { code: string; name: string; sites: VaccineLocation[] }

/** Sites grouped by kabupaten (by name, sites without a known kabupaten last), optionally one kabupaten only. */
export function groupLocations(list: VaccineLocation[], only: AreaRef | null, unknown: string): LocationGroup[] {
  const by = new Map<string, LocationGroup>()
  for (const s of list) {
    if (only && s.kabupaten?.code !== only.code) continue
    const code = s.kabupaten?.code ?? 'unknown'
    const g = by.get(code) ?? { code, name: s.kabupaten?.name ?? unknown, sites: [] }
    g.sites.push(s)
    by.set(code, g)
  }
  return [...by.values()]
    .map((g) => ({ ...g, sites: [...g.sites].sort((a, b) => a.name.localeCompare(b.name, 'id')) }))
    .sort((a, b) => (a.code === 'unknown' ? 1 : b.code === 'unknown' ? -1 : a.name.localeCompare(b.name, 'id')))
}

/** Kabupaten that have at least one site, for the filter. */
export const kabupatenWithSites = (list: VaccineLocation[]): AreaRef[] => {
  const m = new Map<string, AreaRef>()
  for (const s of list) if (s.kabupaten) m.set(s.kabupaten.code, s.kabupaten)
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'id'))
}

export type { IsoDate }

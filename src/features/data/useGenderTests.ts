import type { GenderSnapshot, TestPeriod, TestType } from '@/api/types'
import type { BarDatum, LineSeries } from '@/components/charts/types'

export type GenderKind = 'positive' | 'pdp'
export type GenderLabels = { male: string; female: string }

/**
 * Bars for the gender and age section. Sex bars carry their share in the label ("Laki-laki (44,8%)"), and every bar has its value as
 * text in the chart, so nothing depends on colour. Both sexes use one role: the role only picks the weave, the label tells them apart.
 */
export function useGenderBars(snap: GenderSnapshot, kind: GenderKind, locale: 'id' | 'en', labels: GenderLabels, pct: (n: number) => string) {
  const s = snap[kind]
  const total = s.male.total + s.female.total
  const share = (n: number) => (total > 0 ? ` (${pct((n / total) * 100)})` : '')
  const sex: BarDatum[] = [
    { key: 'male', label: `${labels.male}${share(s.male.total)}`, value: s.male.total, role: 'positive' },
    { key: 'female', label: `${labels.female}${share(s.female.total)}`, value: s.female.total, role: 'positive' },
  ]
  const ages = (g: GenderSnapshot['positive']['male']): BarDatum[] => g.ages.map((a) => ({ key: a.key, label: a.label[locale], value: a.count, role: 'positive' }))
  return { total, sex, male: ages(s.male), female: ages(s.female) }
}

/** The one largest value across both sexes' age bars, so the two charts share a scale and can be compared. */
export const ageMax = (a: BarDatum[], b: BarDatum[]): number => Math.max(0, ...[...a, ...b].map((x) => x.value ?? 0)) // a missing number counts as nothing for the scale only

/**
 * Positive and negative per reporting period for one test type. Each point sits on the first day of its period. The roles only pick
 * the line forms: the labels at the line ends say which is which.
 */
export function useTestSeries(periods: TestPeriod[], type: 'pcr' | 'rdt', labels: { positive: string; negative: string }) {
  const rows = periods.filter((p) => p.type === type)
  const line = (id: string, role: LineSeries['role'], label: string, f: (p: TestPeriod) => number): LineSeries => ({ id, role, label, points: rows.map((p) => ({ x: p.from, y: f(p) })) })
  return {
    series: [line('positive', 'positive', labels.positive, (p) => p.positive), line('negative', 'recovered', labels.negative, (p) => p.negative)],
    last: rows.at(-1),
    first: rows.at(0),
  }
}

/** The description of a test type from `/stats/test-types`. */
export const typeInfo = (types: TestType[], key: 'pcr' | 'rdt'): TestType | undefined => types.find((t) => t.key === key)

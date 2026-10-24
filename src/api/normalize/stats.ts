import type { AgeBucket, AgeKey, GenderSnapshot, TestPeriod, TestType } from '../types'
import type { WireAgeGroups, WireGenderLatest, WireTestRow, WireTestType } from '../wire'
import { isoDate } from './date'

const AGES: { key: AgeKey; label: { id: string; en: string } }[] = [
  { key: '0_14', label: { id: '0 sampai 14 tahun', en: '0 to 14 years' } },
  { key: '15_19', label: { id: '15 sampai 19 tahun', en: '15 to 19 years' } },
  { key: '20_24', label: { id: '20 sampai 24 tahun', en: '20 to 24 years' } },
  { key: '25_49', label: { id: '25 sampai 49 tahun', en: '25 to 49 years' } },
  { key: '50_54', label: { id: '50 sampai 54 tahun', en: '50 to 54 years' } },
  { key: '55_plus', label: { id: '55 tahun ke atas', en: '55 years and over' } },
]
const buckets = (g: WireAgeGroups): AgeBucket[] => AGES.map((a) => ({ ...a, count: typeof g[a.key] === 'number' ? g[a.key]! : null }))

/** The API row has no date (C1 Q4, `day` cannot be dated), so `asOf` is null until API ask A2. */
export function genderSnapshot(w: WireGenderLatest): GenderSnapshot {
  const side = (s: WireGenderLatest['positive']) => ({
    male: { total: s.male.total, ages: buckets(s.male.age_groups) },
    female: { total: s.female.total, ages: buckets(s.female.age_groups) },
  })
  return { asOf: null, positive: side(w.positive), pdp: side(w.pdp) }
}

/** Only `pcr` and `rdt` rows exist in the data. Ascending by date, then type. */
export function testPeriods(wire: WireTestRow[]): TestPeriod[] {
  return wire
    .flatMap((w): TestPeriod[] => {
      const type = w.test_type.key
      if (type !== 'pcr' && type !== 'rdt') return []
      return [{ from: isoDate(w.date_from), type, process: w.process, invalid: w.invalid, positive: w.positive, negative: w.negative }]
    })
    .sort((a, b) => (a.from === b.from ? a.type.localeCompare(b.type) : a.from < b.from ? -1 : 1))
}

export const testTypes = (wire: WireTestType[]): TestType[] =>
  wire.map((t) => ({ key: t.key, name: t.name, sample: t.sample, duration: t.duration, recommended: t.is_recommended }))

import type { Doses, VaccinationDay, VaccinationGroupKey, VaccineLocation } from '../types'
import type { WireDoses, WireVaccinationDay, WireVaccineLocation } from '../wire'
import { kabupatenRef } from '@/app/areas'
import { isoDate } from './date'

const doses = (d: WireDoses): Doses => ({ dose1: d.dose_1, dose2: d.dose_2 })
// Order of the groups as the page shows them. Unknown groups from the API are ignored.
const GROUPS: VaccinationGroupKey[] = ['health_worker', 'public_officer', 'elderly', 'public', 'teenager']

/** Ascending by date, one row per date (last wins). `day` is ignored (C1 Q1). Coverage stays a raw percent and can exceed 100. */
export function vaccinationSeries(wire: WireVaccinationDay[]): VaccinationDay[] {
  const byDate = new Map<string, VaccinationDay>()
  for (const w of wire) {
    const date = isoDate(w.date)
    byDate.set(date, {
      date,
      target: w.target,
      total: { daily: doses(w.total.daily), cumulative: doses(w.total.cumulative), coverage: doses(w.total.coverage) },
      groups: GROUPS.flatMap((key) => {
        const g = w.groups[key]
        return g ? [{ key, target: g.target, cumulative: doses(g.cumulative), coverage: doses(g.coverage) }] : []
      }),
    })
  }
  const days = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
  days.forEach((d, i) => {
    if (i > 0) d.previousDaily = days[i - 1]!.total.daily
  })
  return days
}

export const vaccineLocations = (wire: WireVaccineLocation[]): VaccineLocation[] =>
  wire.map((w) => ({
    id: w.id,
    kabupaten: kabupatenRef(w.regency_id),
    name: w.name,
    address: w.address,
    hours: w.operational_time,
    firstDose: w.is_first_vaccination,
    secondDose: w.is_second_vaccination,
    notes: w.notes?.trim() || null,
  }))

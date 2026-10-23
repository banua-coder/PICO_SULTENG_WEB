import { fetchJson } from './client'
import { ENDPOINTS } from './endpoints'
import { isArrayOf, isWireGenderLatest, isWireTestRow, isWireTestType, isWireVaccinationDay, isWireVaccineLocation } from './guards'
import { genderSnapshot, testPeriods, testTypes } from './normalize/stats'
import { vaccinationSeries, vaccineLocations } from './normalize/vaccination'
import { useResource } from './resource'
import type { GenderSnapshot, Resource, TestPeriod, TestType, VaccinationDay, VaccineLocation } from './types'

export function useGenderSnapshot(): Resource<GenderSnapshot> {
  const p = ENDPOINTS.genderLatest.path
  return useResource(p, (signal) => fetchJson(p, { signal, guard: isWireGenderLatest }).then(genderSnapshot))
}

export function useTests(): Resource<{ periods: TestPeriod[]; types: TestType[] }> {
  const rows = ENDPOINTS.tests.path
  const types = ENDPOINTS.testTypes.path
  return useResource('tests+types', async (signal) => {
    const [r, t] = await Promise.all([
      fetchJson(rows, { signal, guard: isArrayOf(isWireTestRow) }),
      fetchJson(types, { signal, guard: isArrayOf(isWireTestType) }),
    ])
    return { periods: testPeriods(r), types: testTypes(t) }
  })
}

export function useVaccination(scope: 'indonesia' | 'sulawesi-tengah'): Resource<VaccinationDay[]> {
  const p = scope === 'indonesia' ? ENDPOINTS.vaccinationNational.path : ENDPOINTS.vaccinationProvince.path
  return useResource(p, (signal) => fetchJson(p, { signal, guard: isArrayOf(isWireVaccinationDay) }).then(vaccinationSeries), { series: true })
}

export function useVaccineLocations(): Resource<VaccineLocation[]> {
  const p = ENDPOINTS.vaccineLocations.path
  return useResource(p, (signal) => fetchJson(p, { signal, guard: isArrayOf(isWireVaccineLocation) }).then(vaccineLocations))
}

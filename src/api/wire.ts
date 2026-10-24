// Wire shapes of contract C1, verbatim field names. Only src/api may import this file (lint rule).
export type Num4 = { positive: number; recovered: number; deceased: number; active: number }
export type WireRt = { value: number | null; upper_bound: number | null; lower_bound: number | null }
export type WireObs = { active: number; finished: number }
export type WireObsTotal = WireObs & { total: number }

export type WireStatistics = {
  percentages: { active: number; recovered: number; deceased: number }
  reproduction_rate: WireRt
}

export type WireNationalCase = { day: number; date: string; daily: Num4; cumulative: Num4; statistics: WireStatistics }

export type WireProvinceCase = {
  day: number
  date: string
  daily: Num4 & { odp: WireObs; pdp: WireObs }
  cumulative: Num4 & { odp: WireObsTotal; pdp: WireObsTotal }
  statistics: WireStatistics
  province?: { id: string; name: string }
}
export type WireProvince = { id: string; name: string; latest_case?: WireProvinceCase }

export type WireRegency = { id: number; province_id: number; name: string; latest_case?: WireRegencyCase | null }
export type WireRegencyCase = {
  id: number
  day: number
  regency_id: number
  date: string
  positive: number
  recovered: number
  deceased: number
  cumulative_positive: number
  cumulative_recovered: number
  cumulative_deceased: number
  person_under_observation: number | null
  finished_person_under_observation: number | null
  person_under_supervision: number | null
  finished_person_under_supervision: number | null
  cumulative_person_under_observation: number | null
  cumulative_finished_person_under_observation: number | null
  cumulative_person_under_supervision: number | null
  cumulative_finished_person_under_supervision: number | null
  rt: number | null
  rt_upper: number | null
  rt_lower: number | null
}

export type WireFlatContact = { id: number; contact_type_id: number; contact_type_name: string; contact: string }
export type WireNestedContact = { id: number; contact_type: { id: number; name: string }; contact: string }

export type WireHospital = {
  id: number
  regency_id: number
  name: string
  hospital_code: string
  address: string
  latitude?: number
  longitude?: number
  contacts: WireFlatContact[]
  igd_count: number
  beds: { id: number; bed_type_name: string; available: number; total: number }[]
}
export type WireTaskForceGroup = {
  regency_id: number
  regency_name: string
  task_forces: { id: number; name: string; contacts: WireFlatContact[] }[]
}

export type WireDoses = { dose_1: number; dose_2: number }
export type WireVacBlock = { daily: WireDoses; cumulative: WireDoses; coverage: WireDoses }
export type WireVaccinationDay = {
  id: number
  day: number
  date: string
  target: number
  total: WireVacBlock
  groups: Record<string, WireVacBlock & { target: number }>
}
export type WireVaccineLocation = {
  id: number
  regency_id: number
  name: string
  address: string
  operational_time: string
  is_first_vaccination: boolean
  is_second_vaccination: boolean
  notes: string | null
}

export type WireAgeGroups = Record<string, number>
export type WireGenderLatest = {
  positive: Record<'male' | 'female', { total: number; age_groups: WireAgeGroups }>
  pdp: Record<'male' | 'female', { total: number; age_groups: WireAgeGroups }>
}
export type WireTestType = { id: number; key: string; name: string; sample: string; duration: string; is_recommended: boolean }
export type WireTestRow = {
  id: number
  date_from: string
  process: number
  invalid: number
  positive: number
  negative: number
  test_type: WireTestType
}

export type WireBanner = { id: number; title: string; link: string; image: string; is_active: boolean }
export type WireInfographic = { id: number; title: string; source: string; images: { id: number; queue: number; image_url: string }[] }
export type WireDonation = {
  id: number
  title: string
  initiator: string
  url: string
  description: string
  image: string
  accept_noncash: boolean
  delivery_address: string | null
  bank_accounts: { id: number; account_number: string; account_name: string; bank: { name: string; nickname: string; logo: string } }[]
  contacts: WireNestedContact[]
}
export type WireTelemedicine = {
  id: number
  name: string
  is_free: boolean
  schedules: { operational_day: string; operational_time: string; timezone: string }[]
  contacts: WireNestedContact[]
}
export type WirePartner = { id: number; name: string; link: string; image: string; in_footer: boolean }

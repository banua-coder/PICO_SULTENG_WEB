// Small hand-written guards (no runtime schema library). A guard checks only the fields this site reads.
// W08 adds one guard per wire type next to the wire types.
export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export const isArrayOf =
  <T>(item: (v: unknown) => v is T) =>
  (v: unknown): v is T[] =>
    Array.isArray(v) && v.every(item)

/** Guard for a record that has the given keys with the given `typeof` types. */
export const hasShape =
  <T extends Record<string, unknown>>(shape: { [K in keyof T]: 'string' | 'number' | 'boolean' | 'object' | 'any' }) =>
  (v: unknown): v is T =>
    isRecord(v) && Object.entries(shape).every(([k, t]) => k in v && (t === 'any' || typeof v[k] === t))

// ---- Wire guards (C1). Each checks only the fields the normalisers read. ----
import type * as W from './wire'

const str = (v: unknown): v is string => typeof v === 'string'
const num = (v: unknown): v is number => typeof v === 'number'
const isObj = (v: unknown): v is Record<string, unknown> => isRecord(v)
const hasObjs = (v: unknown, ...keys: string[]) => isRecord(v) && keys.every((k) => isRecord(v[k]))
const numOrNull = (v: unknown) => v === null || num(v)

const isStatistics = (v: unknown): v is W.WireStatistics =>
  isRecord(v) && isRecord(v.reproduction_rate) && numOrNull(v.reproduction_rate.value)

export const isWireNationalCase = (v: unknown): v is W.WireNationalCase =>
  isRecord(v) && str(v.date) && hasObjs(v, 'daily', 'cumulative') && isStatistics(v.statistics) && num((v.daily as W.Num4).positive)

export const isWireProvinceCase = (v: unknown): v is W.WireProvinceCase =>
  isRecord(v) &&
  str(v.date) &&
  hasObjs(v, 'daily', 'cumulative') &&
  isStatistics(v.statistics) &&
  isRecord((v.daily as Record<string, unknown>).odp) &&
  isRecord((v.cumulative as Record<string, unknown>).odp)

export const isWireProvince = (v: unknown): v is W.WireProvince =>
  isRecord(v) && str(v.id) && str(v.name) && (v.latest_case === undefined || isWireProvinceCase(v.latest_case))

export const isWireRegencyCase = (v: unknown): v is W.WireRegencyCase =>
  isRecord(v) && str(v.date) && num(v.positive) && num(v.cumulative_positive) && numOrNull(v.rt) && numOrNull(v.cumulative_person_under_observation)

export const isWireRegency = (v: unknown): v is W.WireRegency =>
  isRecord(v) && num(v.id) && str(v.name) && (v.latest_case == null || isWireRegencyCase(v.latest_case))

const isContactList = (v: unknown) => Array.isArray(v) && v.every((c) => isRecord(c) && str(c.contact))
export const isWireHospital = (v: unknown): v is W.WireHospital =>
  isRecord(v) && num(v.regency_id) && str(v.name) && str(v.hospital_code) && isContactList(v.contacts) && Array.isArray(v.beds)
export const isWireTaskForceGroup = (v: unknown): v is W.WireTaskForceGroup =>
  isRecord(v) && num(v.regency_id) && Array.isArray(v.task_forces) && v.task_forces.every((t) => isRecord(t) && str(t.name) && isContactList(t.contacts))

const isBlock = (v: unknown) => hasObjs(v, 'daily', 'cumulative', 'coverage')
export const isWireVaccinationDay = (v: unknown): v is W.WireVaccinationDay =>
  isRecord(v) && str(v.date) && num(v.target) && isBlock(v.total) && isObj(v.groups)
export const isWireVaccineLocation = (v: unknown): v is W.WireVaccineLocation =>
  isRecord(v) && num(v.id) && str(v.name) && str(v.operational_time)

export const isWireGenderLatest = (v: unknown): v is W.WireGenderLatest =>
  isRecord(v) && isRecord(v.positive) && isRecord(v.pdp) && isRecord((v.positive as Record<string, unknown>).male)
export const isWireTestRow = (v: unknown): v is W.WireTestRow => isRecord(v) && str(v.date_from) && num(v.process) && isRecord(v.test_type)
export const isWireTestType = (v: unknown): v is W.WireTestType => isRecord(v) && str(v.key) && str(v.name)

export const isWireBanner = (v: unknown): v is W.WireBanner => isRecord(v) && num(v.id) && str(v.title)
export const isWireInfographic = (v: unknown): v is W.WireInfographic => isRecord(v) && num(v.id) && str(v.title) && Array.isArray(v.images)
export const isWireDonation = (v: unknown): v is W.WireDonation =>
  isRecord(v) && num(v.id) && str(v.title) && Array.isArray(v.bank_accounts) && Array.isArray(v.contacts)
export const isWireTelemedicine = (v: unknown): v is W.WireTelemedicine =>
  isRecord(v) && num(v.id) && str(v.name) && Array.isArray(v.schedules) && Array.isArray(v.contacts)
export const isWirePartner = (v: unknown): v is W.WirePartner => isRecord(v) && num(v.id) && str(v.name)

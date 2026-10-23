import type { Ref } from 'vue'

// Contract C2: shared by the data layer and its consumers. Domain types are added by W08.
export type ApiErrorKind = 'network' | 'http' | 'shape'
export type ApiError = { kind: ApiErrorKind; status?: number }

export type ResourceStatus = 'idle' | 'loading' | 'success' | 'error'

export type Resource<T> = {
  data: Readonly<Ref<T | undefined>>
  error: Readonly<Ref<ApiError | null>>
  status: Readonly<Ref<ResourceStatus>>
  refresh: () => Promise<void>
}

// ---- Domain types (contract C2). Pages see only these, never the wire shapes of C1. ----
export type IsoDate = string // 'YYYY-MM-DD': first 10 chars of the API timestamp (+07:00). Never re-zoned
export type AreaLevel = 'indonesia' | 'provinsi' | 'kabupaten'
export type AreaRef = { level: AreaLevel; code: string; slug: string; name: string } // code: '0' for Indonesia, '72', '7271'

export type RtPoint = { value: number; lower: number; upper: number } | null
export type Observation = { active: number | null; finished: number | null; total: number | null }

export type DailyRow = {
  date: IsoDate
  daily: { positive: number; recovered: number; deceased: number; active: number | null }
  cumulative: { positive: number; recovered: number; deceased: number; active: number | null }
  rt: RtPoint
  odp: Observation | null // null for Indonesia
  pdp: Observation | null
}
export type Series = { area: AreaRef; rows: DailyRow[]; first: IsoDate; last: IsoDate } // rows ascending by date, unique dates

export type LatestByArea = { area: AreaRef; latest: DailyRow }

export type AgeKey = '0_14' | '15_19' | '20_24' | '25_49' | '50_54' | '55_plus'
export type AgeBucket = { key: AgeKey; label: { id: string; en: string }; count: number }
export type GenderSnapshot = {
  asOf: IsoDate | null // null until API ask A2
  positive: Record<'male' | 'female', { total: number; ages: AgeBucket[] }>
  pdp: Record<'male' | 'female', { total: number; ages: AgeBucket[] }>
}

export type TestPeriod = { from: IsoDate; type: 'pcr' | 'rdt'; process: number; invalid: number; positive: number; negative: number }
export type TestType = { key: string; name: string; sample: string; duration: string; recommended: boolean }

export type Doses = { dose1: number; dose2: number }
export type VaccinationGroupKey = 'health_worker' | 'public_officer' | 'elderly' | 'public' | 'teenager'
export type VaccinationDay = {
  date: IsoDate
  target: number
  total: { daily: Doses; cumulative: Doses; coverage: Doses }
  groups: { key: VaccinationGroupKey; target: number; cumulative: Doses; coverage: Doses }[]
}
export type VaccineLocation = {
  id: number
  kabupaten: AreaRef | null
  name: string
  address: string
  hours: string
  firstDose: boolean
  secondDose: boolean
  notes: string | null
}

export type ContactKind = 'email' | 'phone' | 'fax' | 'website' | 'whatsapp' | 'telegram' | 'twitter' | 'instagram' | 'line'
export type Contact = { kind: ContactKind; label: string; href: string } // href: https:, tel:, mailto: only. '' for fax (text)

export type Hospital = {
  code: string
  name: string
  kabupaten: AreaRef | null
  address: string
  contacts: Contact[]
  beds: { type: string; available: number; total: number }[]
  igdCount: number
}
export type TaskForceGroup = { kabupaten: AreaRef; members: { name: string; contacts: Contact[] }[] }

export type Banner = { id: number; title: string; href: string | null; image: string | null }
export type Infographic = { id: number; title: string; source: string | null; images: string[] } // ordered by queue, unusable URLs dropped
export type Donation = {
  id: number
  title: string
  initiator: string
  href: string | null
  description: string
  image: string | null
  acceptsGoods: boolean
  deliveryAddress: string | null
  accounts: { bank: string; bankShort: string; number: string; holder: string; logo: string | null }[]
  contacts: Contact[]
}
export type Telemedicine = {
  id: number
  name: string
  free: boolean
  schedules: { days: string; hours: string; tz: string }[]
  contacts: Contact[]
}
export type Partner = { id: number; name: string; href: string; inFooter: boolean }

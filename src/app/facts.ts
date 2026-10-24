import { DOWNLOAD_HEADER } from '@/app/csv'
import { RECORD_FIRST, RECORD_LAST } from '@/app/dateWindow'

// The numbers the Methodology page states. Each one is checked against the data in facts.test.ts, so a change in the data or in
// the Rt job fails a test instead of leaving the page wrong (spec 74).
export const FACTS = {
  recordFirst: RECORD_FIRST,
  recordLast: RECORD_LAST,
  /** EpiEstim, parametric serial interval */
  serialMean: 7.5,
  serialSd: 3.4,
  windowDays: 7,
  /** Rt is null for a window with fewer new cases than this (C1 Q6) */
  minCases: 12,
  /** last day with an Rt value */
  rtLastNational: '2023-07-09',
  rtLastSulteng: '2023-06-24',
  /** last day with ODP/PDP numbers for Sulawesi Tengah */
  odpEnd: '2022-05-08',
  /** last test period (start date) and last vaccination day */
  testsEnd: '2020-09-28',
  vaccinationEnd: '2022-03-25',
} as const

export const API_BASE = 'https://pico-api.banuacoder.com/api/v1'
export const API_ORIGIN = 'https://pico-api.banuacoder.com'
export const DOCS_URL = 'https://pico-api.banuacoder.com/'
export const APP_RELEASES_URL = 'https://github.com/ryanaidilp/PICO_SULTENG_FLUTTER/releases'
export const APP_LATEST = { version: '7.0.0', file: 'PICO.Sulteng.v7.0.0.apk', mb: 25.8 } as const
export const SWAGGER_URL = 'https://pico-api.banuacoder.com/swagger/index.html'
export const REPO_URL = 'https://github.com/banua-coder/PICO_SULTENG_WEB'

/** What each column of the download files holds. One entry per DOWNLOAD_HEADER column (tested). */
export const COLUMN_DOCS: Record<'id' | 'en', Record<string, string>> = {
  id: {
    area_code: 'Kode wilayah BPS. 0 untuk Indonesia, dua angka untuk provinsi, empat angka untuk kabupaten/kota.',
    area_name: 'Nama wilayah.',
    date: 'Tanggal, format YYYY-MM-DD.',
    positive_daily: 'Kasus positif baru pada hari itu.',
    recovered_daily: 'Sembuh pada hari itu.',
    deceased_daily: 'Meninggal pada hari itu.',
    active_daily: 'Perubahan jumlah pasien dirawat pada hari itu. Kosong untuk kabupaten/kota.',
    positive_cumulative: 'Total kasus positif sampai hari itu.',
    recovered_cumulative: 'Total sembuh sampai hari itu.',
    deceased_cumulative: 'Total meninggal sampai hari itu.',
    active_cumulative: 'Pasien dirawat pada hari itu. Kosong untuk kabupaten/kota.',
    rt: 'Angka reproduksi Rt (perkiraan). Kosong bila tidak dihitung.',
    rt_lower: 'Batas bawah rentang kredibel 95% dari Rt.',
    rt_upper: 'Batas atas rentang kredibel 95% dari Rt.',
    odp_active: 'ODP yang masih dipantau (kumulatif). Kosong setelah pelaporan berhenti.',
    odp_finished: 'ODP yang selesai dipantau (kumulatif).',
    odp_total: 'Total ODP (kumulatif).',
    pdp_active: 'PDP yang masih diawasi (kumulatif). Kosong setelah pelaporan berhenti.',
    pdp_finished: 'PDP yang selesai diawasi (kumulatif).',
    pdp_total: 'Total PDP (kumulatif).',
  },
  en: {
    area_code: 'BPS area code. 0 for Indonesia, two digits for a province, four digits for a regency or city.',
    area_name: 'Area name.',
    date: 'Date, format YYYY-MM-DD.',
    positive_daily: 'New positive cases on that day.',
    recovered_daily: 'Recovered on that day.',
    deceased_daily: 'Deceased on that day.',
    active_daily: 'Change in the number of patients under treatment on that day. Empty for a regency or city.',
    positive_cumulative: 'Total positive cases up to that day.',
    recovered_cumulative: 'Total recovered up to that day.',
    deceased_cumulative: 'Total deceased up to that day.',
    active_cumulative: 'Patients under treatment on that day. Empty for a regency or city.',
    rt: 'Reproduction number Rt (an estimate). Empty when it was not computed.',
    rt_lower: 'Lower bound of the 95% credible interval of Rt.',
    rt_upper: 'Upper bound of the 95% credible interval of Rt.',
    odp_active: 'ODP still under monitoring (cumulative). Empty after reporting stopped.',
    odp_finished: 'ODP whose monitoring finished (cumulative).',
    odp_total: 'Total ODP (cumulative).',
    pdp_active: 'PDP still under supervision (cumulative). Empty after reporting stopped.',
    pdp_finished: 'PDP whose supervision finished (cumulative).',
    pdp_total: 'Total PDP (cumulative).',
  },
}

export const COLUMNS: readonly string[] = DOWNLOAD_HEADER

import type { AreaLevel, AreaRef } from '@/api/types'

// Contract C5: the slug table. Codes are BPS codes. Slugs are final once the site is public.
// Names: provinces as the API spells them, kabupaten with the display overrides of O-7 (Tolitoli, Parigi Moutong).

/** lowercase, each run of non [a-z0-9] becomes '-', trim '-' */
export const slugify = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const PROVINCES: [code: string, name: string, slug: string][] = [
  ['11', 'Aceh', 'aceh'],
  ['12', 'Sumatera Utara', 'sumatera-utara'],
  ['13', 'Sumatera Barat', 'sumatera-barat'],
  ['14', 'Riau', 'riau'],
  ['15', 'Jambi', 'jambi'],
  ['16', 'Sumatera Selatan', 'sumatera-selatan'],
  ['17', 'Bengkulu', 'bengkulu'],
  ['18', 'Lampung', 'lampung'],
  ['19', 'Kepulauan Bangka Belitung', 'kepulauan-bangka-belitung'],
  ['21', 'Kepulauan Riau', 'kepulauan-riau'],
  ['31', 'DKI Jakarta', 'dki-jakarta'],
  ['32', 'Jawa Barat', 'jawa-barat'],
  ['33', 'Jawa Tengah', 'jawa-tengah'],
  ['34', 'Daerah Istimewa Yogyakarta', 'daerah-istimewa-yogyakarta'],
  ['35', 'Jawa Timur', 'jawa-timur'],
  ['36', 'Banten', 'banten'],
  ['51', 'Bali', 'bali'],
  ['52', 'Nusa Tenggara Barat', 'nusa-tenggara-barat'],
  ['53', 'Nusa Tenggara Timur', 'nusa-tenggara-timur'],
  ['61', 'Kalimantan Barat', 'kalimantan-barat'],
  ['62', 'Kalimantan Tengah', 'kalimantan-tengah'],
  ['63', 'Kalimantan Selatan', 'kalimantan-selatan'],
  ['64', 'Kalimantan Timur', 'kalimantan-timur'],
  ['65', 'Kalimantan Utara', 'kalimantan-utara'],
  ['71', 'Sulawesi Utara', 'sulawesi-utara'],
  ['72', 'Sulawesi Tengah', 'sulawesi-tengah'],
  ['73', 'Sulawesi Selatan', 'sulawesi-selatan'],
  ['74', 'Sulawesi Tenggara', 'sulawesi-tenggara'],
  ['75', 'Gorontalo', 'gorontalo'],
  ['76', 'Sulawesi Barat', 'sulawesi-barat'],
  ['81', 'Maluku', 'maluku'],
  ['82', 'Maluku Utara', 'maluku-utara'],
  ['91', 'Papua Barat', 'papua-barat'],
  ['94', 'Papua', 'papua'],
]

// [code, API name, display name, slug]
const KABUPATEN: [code: string, apiName: string, name: string, slug: string][] = [
  ['7201', 'Banggai Kepulauan', 'Banggai Kepulauan', 'banggai-kepulauan'],
  ['7202', 'Banggai', 'Banggai', 'banggai'],
  ['7203', 'Morowali', 'Morowali', 'morowali'],
  ['7204', 'Poso', 'Poso', 'poso'],
  ['7205', 'Donggala', 'Donggala', 'donggala'],
  ['7206', 'Toli-Toli', 'Tolitoli', 'tolitoli'],
  ['7207', 'Buol', 'Buol', 'buol'],
  ['7208', 'Parigi Mautong', 'Parigi Moutong', 'parigi-moutong'],
  ['7209', 'Tojo Una-Una', 'Tojo Una-Una', 'tojo-una-una'],
  ['7210', 'Sigi', 'Sigi', 'sigi'],
  ['7211', 'Banggai Laut', 'Banggai Laut', 'banggai-laut'],
  ['7212', 'Morowali Utara', 'Morowali Utara', 'morowali-utara'],
  ['7271', 'Kota Palu', 'Kota Palu', 'kota-palu'],
]

export const INDONESIA: AreaRef = { level: 'indonesia', code: '0', slug: 'indonesia', name: 'Indonesia' }

export const PROVINCE_AREAS: AreaRef[] = PROVINCES.map(([code, name, slug]) => ({ level: 'provinsi', code, slug, name }))
export const KABUPATEN_AREAS: AreaRef[] = KABUPATEN.map(([code, , name, slug]) => ({ level: 'kabupaten', code, slug, name }))

const byKey = new Map<string, AreaRef>(
  [INDONESIA, ...PROVINCE_AREAS, ...KABUPATEN_AREAS].map((a) => [`${a.level}:${a.code}`, a]),
)
const bySlug = new Map<string, AreaRef>(
  [INDONESIA, ...PROVINCE_AREAS, ...KABUPATEN_AREAS].map((a) => [`${a.level}:${a.slug}`, a]),
)

export const SULTENG = byKey.get('provinsi:72')!

export const areaByCode = (level: AreaLevel, code: string | number): AreaRef | undefined => byKey.get(`${level}:${code}`)
export const areaBySlug = (level: AreaLevel, slug: string): AreaRef | undefined => bySlug.get(`${level}:${slug}`)

/** The API's own spelling for a kabupaten code (geojson and API use it), e.g. 7208 -> 'Parigi Mautong'. */
export const kabupatenApiName = (code: string | number): string | undefined => KABUPATEN.find(([c]) => c === String(code))?.[1]

/** Area for a kabupaten code, or null for an unknown code. */
export const kabupatenRef = (code: string | number): AreaRef | null => areaByCode('kabupaten', code) ?? null

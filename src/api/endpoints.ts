// The C1 endpoints the web reads. Paths always ask for the whole list (all=true / load_all=true).
// `trim` is for the fixture recorder only: 'series' keeps the first and last 60 rows plus out-of-order rows.
export type EndpointDef = { name: string; path: string; trim?: 'series' | number }

export const ENDPOINTS = {
  national: { name: 'national', path: '/national?all=true', trim: 'series' },
  nationalLatest: { name: 'national-latest', path: '/national/latest' },
  provinces: { name: 'provinces', path: '/provinces' },
  provinceIds: { name: 'province-ids', path: '/provinces?exclude_latest_case=true' },
  province72: { name: 'province-72-cases', path: '/provinces/72/cases?all=true', trim: 'series' },
  regencies: { name: 'regencies', path: '/regencies?load_all=true' },
  regency7271: { name: 'regency-7271-cases', path: '/regencies/7271/cases', trim: 'series' },
  hospitals: { name: 'hospitals', path: '/hospitals?load_all=true' },
  taskForces: { name: 'task-forces', path: '/task-forces?load_all=true' },
  vaccinationNational: { name: 'vaccination-national', path: '/vaccination/national?load_all=true', trim: 'series' },
  vaccinationProvince: { name: 'vaccination-province', path: '/vaccination/province?load_all=true', trim: 'series' },
  vaccineLocations: { name: 'vaccine-locations', path: '/vaccination/locations?load_all=true' },
  genderLatest: { name: 'gender-latest', path: '/stats/gender/latest' },
  tests: { name: 'tests', path: '/stats/tests', trim: 'series' },
  testTypes: { name: 'test-types', path: '/stats/test-types' },
  banners: { name: 'banners', path: '/banners' },
  infographics: { name: 'infographics', path: '/infographics?load_all=true', trim: 12 },
  donations: { name: 'donations', path: '/donations?load_all=true' },
  telemedicines: { name: 'telemedicines', path: '/telemedicines?load_all=true' },
  partners: { name: 'partners', path: '/partners?load_all=true' },
} as const satisfies Record<string, EndpointDef>

import { KABUPATEN_AREAS, PROVINCE_AREAS } from './areas'
import { localizePath } from './locale'
import type { Locale } from './locale'

// Contract C5: every public URL, for prerender and sitemap. 2 x (10 + 34 + 13) = 114 pages.
const STATIC = ['/', '/data', '/data/indonesia', '/tabel-data', '/vaksin', '/infografis', '/kontak', '/wiki', '/isoman', '/metodologi']

/** Indonesian paths of every page (57). */
export const sitePathsId = (): string[] => [
  ...STATIC,
  ...PROVINCE_AREAS.map((a) => `/data/provinsi/${a.slug}`),
  ...KABUPATEN_AREAS.map((a) => `/data/kabupaten/${a.slug}`),
]

/** A page in both locales: [[id path, en path], ...]. */
export const sitePairs = (): [string, string][] => sitePathsId().map((p) => [localizePath(p, 'id'), localizePath(p, 'en')])

/** All 114 paths, each area's two locales next to each other so a series fetched for one is reused for the other. */
export const sitePaths = (): string[] => sitePairs().flat()

/** Path of the not-found page. It is prerendered to 404.html. */
export const NOT_FOUND_PATH = '/404'

export const pathFor = (p: string, l: Locale) => localizePath(p, l)

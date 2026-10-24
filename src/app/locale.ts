// Pure helpers for the C5 locale prefix: Bahasa Indonesia has none, English is /en.
export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'id'

const EN = /^\/en(?=\/|$)/

export const localeFromPath = (path: string): Locale => (EN.test(path) ? 'en' : 'id')
export const otherLocale = (l: Locale): Locale => (l === 'id' ? 'en' : 'id')

/** '/en/data' -> '/data', '/en' -> '/'. Takes a path without query or hash. */
export const stripLocale = (path: string): string => path.replace(EN, '') || '/'

/** Path for a locale. Beranda in English is '/en/' (C5). */
export function localizePath(path: string, locale: Locale): string {
  const bare = stripLocale(path)
  if (locale === 'id') return bare
  return bare === '/' ? '/en/' : `/en${bare}`
}

/** Same page in the other locale, keeping the query and hash. Takes a full path (`route.fullPath`). */
export function switchLocalePath(fullPath: string, to: Locale): string {
  const i = fullPath.search(/[?#]/)
  const path = i === -1 ? fullPath : fullPath.slice(0, i)
  const rest = i === -1 ? '' : fullPath.slice(i)
  return localizePath(path, to) + rest
}

import type { Locale } from './locale'
import { localizePath, stripLocale } from './locale'

// The 9 pages of contract C5, in nav order. `path` is the Indonesian path.
export const NAV_ITEMS = [
  { key: 'beranda', path: '/' },
  { key: 'data', path: '/data' },
  { key: 'tabel', path: '/tabel-data' },
  { key: 'vaksin', path: '/vaksin' },
  { key: 'infografis', path: '/infografis' },
  { key: 'kontak', path: '/kontak' },
  { key: 'wiki', path: '/wiki' },
  { key: 'isoman', path: '/isoman' },
  { key: 'metodologi', path: '/metodologi' },
] as const

export type NavKey = (typeof NAV_ITEMS)[number]['key']
export type NavItem = { key: NavKey; to: string; label: string; active: boolean }

/** A nav item is active for its own page and anything under it (/data covers /data/provinsi/aceh). */
export function isNavActive(itemPath: string, currentPath: string): boolean {
  const here = stripLocale(currentPath.replace(/\/+$/, '') || '/')
  return itemPath === '/' ? here === '/' : here === itemPath || here.startsWith(`${itemPath}/`)
}

export const navTo = (itemPath: string, locale: Locale) => localizePath(itemPath, locale)

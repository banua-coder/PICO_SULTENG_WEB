import type { Locale } from './locale'
import { localizePath, stripLocale } from './locale'

// The 10 pages of contract C5, in nav order. `path` is the Indonesian path.
// `primary` items sit in the top bar (the old PICO order: Beranda, Data, Vaksin, Isoman, Kontak, Wiki, with Mulai added);
// the others sit under "Lainnya". On a phone the bottom bar shows the `tab` items and "Lainnya" opens the rest.
export const NAV_ITEMS = [
  { key: 'beranda', path: '/', primary: true, tab: true },
  { key: 'mulai', path: '/mulai', primary: true, tab: false },
  { key: 'data', path: '/data', primary: true, tab: true },
  { key: 'vaksin', path: '/vaksin', primary: true, tab: false },
  { key: 'isoman', path: '/isoman', primary: true, tab: false },
  { key: 'kontak', path: '/kontak', primary: true, tab: true },
  { key: 'wiki', path: '/wiki', primary: true, tab: false },
  { key: 'tabel', path: '/tabel-data', primary: false, tab: false },
  { key: 'infografis', path: '/infografis', primary: false, tab: false },
  { key: 'metodologi', path: '/metodologi', primary: false, tab: false },
] as const

export type NavKey = (typeof NAV_ITEMS)[number]['key']
export type NavItem = { key: NavKey; to: string; label: string; active: boolean; primary: boolean; tab: boolean }

/** A nav item is active for its own page and anything under it (/data covers /data/provinsi/aceh). */
export function isNavActive(itemPath: string, currentPath: string): boolean {
  const here = stripLocale(currentPath.replace(/\/+$/, '') || '/')
  return itemPath === '/' ? here === '/' : here === itemPath || here.startsWith(`${itemPath}/`)
}

export const navTo = (itemPath: string, locale: Locale) => localizePath(itemPath, locale)

import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

// Contract C5: one table for both locales. Indonesian has no prefix, English is /en.
// Names follow C5; the English twin of a route is `<name>.en`.
type Def = { name: string; path: string; view: () => Promise<{ default: Component }> }

export const PAGES: Def[] = [
  { name: 'beranda', path: '/', view: () => import('@/features/beranda/BerandaView.vue') },
  { name: 'data', path: '/data', view: () => import('@/features/data/DataView.vue') },
  { name: 'data-nasional', path: '/data/indonesia', view: () => import('@/features/data/DataView.vue') },
  { name: 'data-provinsi', path: '/data/provinsi/:slug', view: () => import('@/features/data/DataView.vue') },
  { name: 'data-kabupaten', path: '/data/kabupaten/:slug', view: () => import('@/features/data/DataView.vue') },
  { name: 'tabel', path: '/tabel-data', view: () => import('@/features/tabel/TabelView.vue') },
  { name: 'vaksin', path: '/vaksin', view: () => import('@/features/vaksin/VaksinView.vue') },
  { name: 'infografis', path: '/infografis', view: () => import('@/features/infografis/InfografisView.vue') },
  { name: 'kontak', path: '/kontak', view: () => import('@/features/kontak/KontakView.vue') },
  { name: 'wiki', path: '/wiki', view: () => import('@/features/wiki/WikiView.vue') },
  { name: 'isoman', path: '/isoman', view: () => import('@/features/isoman/IsomanView.vue') },
  { name: 'metodologi', path: '/metodologi', view: () => import('@/features/metodologi/MetodologiView.vue') },
]

const notFound = () => import('@/app/NotFoundView.vue')
const withEn = (path: string) => (path === '/' ? '/en/' : `/en${path}`)

export function buildRoutes(kit: RouteRecordRaw[] = []): RouteRecordRaw[] {
  return [
    ...PAGES.flatMap((p): RouteRecordRaw[] => [
      { name: p.name, path: p.path, component: p.view },
      { name: `${p.name}.en`, path: withEn(p.path), component: p.view },
    ]),
    ...kit,
    // anything else (SSG writes this one as 404.html, nginx serves it with status 404)
    { name: 'tidak-ditemukan', path: '/:pathMatch(.*)*', component: notFound },
  ]
}

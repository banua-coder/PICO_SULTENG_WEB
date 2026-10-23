import type { RouteRecordRaw } from 'vue-router'
import { buildRoutes } from './routeTable'

// Test page for the component kit (spec 12). Present in dev and in builds made with VITE_KIT=1, never in production builds.
const kit: RouteRecordRaw[] =
  import.meta.env.DEV || import.meta.env.VITE_KIT
    ? [
        { name: 'kit', path: '/_kit', component: () => import('@/features/kit/KitView.vue') },
        { name: 'kit.en', path: '/en/_kit', component: () => import('@/features/kit/KitView.vue') },
      ]
    : []

export const routes = buildRoutes(kit)

/** Moves to the top, or to the hash target. Reduced motion never scrolls smoothly. */
export function scrollBehavior(to: { hash: string; path: string }, from: { path: string }, saved: { left: number; top: number } | null) {
  if (saved) return saved
  if (to.hash) {
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    return { el: to.hash, behavior: reduce ? 'auto' : 'smooth' } as const
  }
  if (to.path === from.path) return false // query-only change (filters, pager): stay put
  return { top: 0 }
}

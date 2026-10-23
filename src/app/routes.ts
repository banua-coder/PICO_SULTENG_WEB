import type { RouteRecordRaw } from 'vue-router'

// W05 replaces this with the full C5 route table. Both locales come from one list.
const beranda = () => import('@/features/beranda/BerandaView.vue')

// Test page for the component kit (spec 12). Present in dev and in builds made with VITE_KIT=1, never in production builds.
const kit: RouteRecordRaw[] =
  import.meta.env.DEV || import.meta.env.VITE_KIT
    ? [
        { path: '/_kit', name: 'kit', component: () => import('@/features/kit/KitView.vue') },
        { path: '/en/_kit', name: 'kit-en', component: () => import('@/features/kit/KitView.vue') },
      ]
    : []

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'beranda', component: beranda },
  { path: '/en/', name: 'beranda-en', component: beranda },
  ...kit,
]

import type { RouteRecordRaw } from 'vue-router'

// W05 replaces this with the full C5 route table. Both locales come from one list.
const beranda = () => import('@/features/beranda/BerandaView.vue')
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'beranda', component: beranda },
  { path: '/en/', name: 'beranda-en', component: beranda },
]

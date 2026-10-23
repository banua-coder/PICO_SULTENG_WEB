import type { RouteRecordRaw } from 'vue-router'

// W05 replaces this with the C5 route table.
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'beranda', component: () => import('@/features/beranda/BerandaView.vue') },
]

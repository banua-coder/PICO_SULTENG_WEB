import { createApp, defineComponent, h } from 'vue'
import type { Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mount } from '@vue/test-utils'
import { createHead } from '@unhead/vue/client'
import { installI18n } from '@/app/i18n'
import { buildRoutes } from '@/app/routeTable'

/** Mount a component with the real router and i18n, at a given route (so '/en/..' gives English). */
export async function mountApp(component: Component, props: Record<string, unknown> = {}, path = '/', slots: Record<string, string> = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
  const probe = createApp({ render: () => null })
  const i18n = installI18n(probe, router)
  await router.push(path)
  await router.isReady()
  const wrapper = mount(
    defineComponent({ render: () => h(component, props, Object.fromEntries(Object.entries(slots).map(([k, v]) => [k, () => v]))) }),
    { global: { plugins: [router, i18n, createHead()] }, attachTo: document.body },
  )
  return { wrapper, router, i18n }
}

export const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0))
}

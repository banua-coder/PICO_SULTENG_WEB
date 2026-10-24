import type { App } from 'vue'
import type { Router } from 'vue-router'
import { createI18n } from 'vue-i18n'
import id from '@/locales/id.json'
import { DEFAULT_LOCALE, localeFromPath } from './locale'
import type { Locale } from './locale'

export type MessageSchema = typeof id

// Bahasa Indonesia is the source and the fallback, so it ships in the main chunk. English is its own chunk.
const loaders: Record<Exclude<Locale, 'id'>, () => Promise<{ default: unknown }>> = {
  en: () => import('@/locales/en.json'),
}

export function createPicoI18n() {
  return createI18n<[MessageSchema], Locale, false>({
    legacy: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    messages: { id } as { id: MessageSchema; en: MessageSchema },
    missingWarn: import.meta.env.DEV,
    fallbackWarn: false,
  })
}

export type PicoI18n = ReturnType<typeof createPicoI18n>

export async function ensureLocale(i18n: PicoI18n, locale: Locale): Promise<void> {
  if (locale === 'id' || i18n.global.availableLocales.includes(locale)) return
  const mod = await loaders[locale]()
  i18n.global.setLocaleMessage(locale, mod.default as MessageSchema)
}

/**
 * Installs vue-i18n and keeps its locale equal to the route prefix (C5). The route is the single source of truth.
 * The locale chunk loads before the navigation resolves, so prerender and hydration never see missing messages.
 */
export function installI18n(app: App, router: Router): PicoI18n {
  const i18n = createPicoI18n()
  app.use(i18n)
  router.beforeEach(async (to) => {
    const locale = localeFromPath(to.path)
    await ensureLocale(i18n, locale)
    i18n.global.locale.value = locale
  })
  return i18n
}

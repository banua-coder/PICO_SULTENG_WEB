import { useHead } from '@unhead/vue'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { localizePath, stripLocale } from './locale'
import { siteUrl } from './site-url'
import type { Locale } from './locale'
import { useLocale } from './useLocale'

export { siteUrl }
export const OG_IMAGE = '/og-image-1200x630.png'
const OG_LOCALE: Record<Locale, string> = { id: 'id_ID', en: 'en_GB' }

export type DatasetLd = { name: string; description: string; areaName: string; locale: Locale }

/** schema.org Dataset for the Data and Tabel pages. No `license` field until O-9 is answered. */
export function datasetLd(d: DatasetLd, base = siteUrl()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: d.name,
    description: d.description,
    inLanguage: d.locale === 'en' ? 'en' : 'id',
    temporalCoverage: '2020-03-02/2024-01-14',
    spatialCoverage: { '@type': 'Place', name: d.areaName },
    isAccessibleForFree: true,
    distribution: [
      ...['indonesia', 'provinsi', 'kabupaten-sulteng'].map((f) => ({ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${base}/unduh/${f}.csv` })),
      ...['indonesia', 'provinsi', 'kabupaten-sulteng'].map((f) => ({
        '@type': 'DataDownload',
        encodingFormat: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        contentUrl: `${base}/unduh/${f}.xlsx`,
      })),
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: 'https://pico-api.banuacoder.com/api/v1' },
    ],
  }
}

export type PageHead = {
  title: MaybeRefOrGetter<string>
  description?: MaybeRefOrGetter<string | undefined>
  /** Indonesian path the canonical URL points at, when it is not the page itself (/data -> the Sulawesi Tengah page). */
  canonicalPath?: MaybeRefOrGetter<string | undefined>
  noindex?: boolean
  dataset?: MaybeRefOrGetter<Omit<DatasetLd, 'locale'> | undefined>
}

/**
 * Title ("<page> · PICO Sulteng"), description, canonical, hreflang (id, en, x-default), Open Graph, Twitter card,
 * `<html lang>` and, for data pages, JSON-LD. Every route view calls it once.
 */
export function usePageHead(opts: PageHead) {
  const { t } = useI18n()
  const route = useRoute()
  const { locale } = useLocale()
  const title = computed(() => t('common.pageTitle', { page: toValue(opts.title), site: t('app.name') }))
  const description = computed(() => toValue(opts.description) ?? t('app.tagline'))
  const own = computed(() => stripLocale(route.path))
  const canonical = computed(() => `${siteUrl()}${localizePath(toValue(opts.canonicalPath) ?? own.value, locale.value)}`)
  const alt = (l: Locale) => `${siteUrl()}${localizePath(own.value, l)}`
  const image = `${siteUrl()}${OG_IMAGE}`
  const ld = computed(() => {
    const d = toValue(opts.dataset)
    return d ? JSON.stringify(datasetLd({ ...d, locale: locale.value })).replace(/</g, '\\u003c') : undefined
  })

  useHead({
    htmlAttrs: { lang: locale },
    title,
    meta: [
      { name: 'description', content: description },
      ...(opts.noindex ? [{ name: 'robots', content: 'noindex' }] : []),
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: () => t('app.name') },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:locale', content: () => OG_LOCALE[locale.value] },
      { property: 'og:locale:alternate', content: () => OG_LOCALE[locale.value === 'id' ? 'en' : 'id'] },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    link: [
      { rel: 'canonical', href: canonical },
      { rel: 'alternate', hreflang: 'id', href: () => alt('id') },
      { rel: 'alternate', hreflang: 'en', href: () => alt('en') },
      { rel: 'alternate', hreflang: 'x-default', href: () => alt('id') },
    ],
  })
  if (opts.dataset) useHead({ script: [{ type: 'application/ld+json', innerHTML: ld, key: 'jsonld' }] })
}

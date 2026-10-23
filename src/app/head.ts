import { useHead } from '@unhead/vue'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Page title and description. W09 extends this with canonical, hreflang and Open Graph tags.
 * Title format: "<page> · PICO Sulteng".
 */
export function usePageHead(opts: { title: MaybeRefOrGetter<string>; description?: MaybeRefOrGetter<string | undefined> }) {
  const { t } = useI18n()
  const title = computed(() => t('common.pageTitle', { page: toValue(opts.title), site: t('app.name') }))
  useHead({
    title,
    meta: [{ name: 'description', content: () => toValue(opts.description) ?? t('app.tagline') }],
  })
}

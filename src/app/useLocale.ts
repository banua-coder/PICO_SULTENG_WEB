import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { localeFromPath, localizePath, otherLocale, switchLocalePath } from './locale'

/** The locale comes from the route prefix (C5). `switchPath` is the same page, in the other locale. */
export function useLocale() {
  const route = useRoute()
  const locale = computed(() => localeFromPath(route.path))
  const other = computed(() => otherLocale(locale.value))
  const switchPath = computed(() => switchLocalePath(route.fullPath, other.value))
  /** Prefix a site path for the current locale: localize('/data') -> '/en/data' in English. */
  const localize = (path: string) => localizePath(path, locale.value)
  return { locale, other, switchPath, localize }
}

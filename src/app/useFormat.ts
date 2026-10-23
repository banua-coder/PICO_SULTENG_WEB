import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { createFormatter } from './format'
import type { DateStyle } from './format'
import { useLocale } from './useLocale'

/**
 * Locale-aware number, percent and date text. Every read goes through the current route locale,
 * so a language switch updates the page. `null` becomes "tidak tersedia", never 0.
 */
export function useFormat() {
  const { t } = useI18n()
  const { locale } = useLocale()
  const f = computed(() =>
    createFormatter(locale.value, {
      notAvailable: t('format.notAvailable', {}, { locale: locale.value }),
      rangeJoin: t('format.rangeJoin', {}, { locale: locale.value }),
    }),
  )
  return {
    num: (n: number, digits?: number) => f.value.num(n, digits),
    pct: (n: number, digits?: number) => f.value.pct(n, digits),
    date: (iso: string, style?: DateStyle) => f.value.date(iso, style),
    month: (iso: string) => f.value.month(iso),
    year: (iso: string) => f.value.year(iso),
    range: (from: string, to: string) => f.value.range(from, to),
    nullable: <T>(v: T | null | undefined, fmt: (v: T) => string) => f.value.nullable(v, fmt),
  }
}

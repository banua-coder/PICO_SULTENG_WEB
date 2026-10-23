<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/app/useLocale'

const { t } = useI18n()
const { switchPath, other } = useLocale()
</script>

<template>
  <RouterLink
    :to="switchPath"
    :hreflang="other"
    :lang="other"
    :aria-label="t('locale.switchToLabel')"
    class="inline-flex min-h-touch items-center rounded-sm border border-line-strong bg-surface px-4 text-sm font-strong text-primary-strong"
  >
    {{ t('locale.switchTo') }}
  </RouterLink>
</template>

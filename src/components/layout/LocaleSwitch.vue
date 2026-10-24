<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Languages } from '@lucide/vue'
import { useLocale } from '@/app/useLocale'
import { Button } from '@/components/ui/button'

const { t } = useI18n()
const { switchPath, other } = useLocale()
</script>

<template>
  <Button as-child variant="outline" class="px-3">
    <RouterLink :to="switchPath" :hreflang="other" :lang="other" :aria-label="t('locale.switchToLabel')" class="text-primary-strong no-underline">
      <Languages aria-hidden="true" />
      <span class="sr-only sm:not-sr-only">{{ t('locale.switchTo') }}</span>
      <span class="sm:hidden" aria-hidden="true">{{ t('locale.code') }}</span>
    </RouterLink>
  </Button>
</template>

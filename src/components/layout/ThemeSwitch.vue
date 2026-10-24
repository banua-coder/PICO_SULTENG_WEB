<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/app/useTheme'

const { t } = useI18n()
const { theme, cycle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="inline-flex min-h-touch items-center rounded-sm border border-line-strong bg-surface px-4 text-sm font-strong text-ink"
    @click="cycle"
  >
    {{ t('theme.label') }}: {{ t(`theme.${theme}`) }}
  </button>
</template>

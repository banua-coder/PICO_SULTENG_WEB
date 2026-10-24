<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePageHead } from '@/app/head'

// Stands in for a page until its task lands (wave 5). Gives every route an h1 and a title.
const props = defineProps<{ page: string; heading?: string }>()
const { t } = useI18n()
usePageHead({ title: () => props.heading ?? t(`nav.${props.page}`) })
</script>

<template>
  <div class="px-5 py-8">
    <h1 class="text-2xl">{{ heading ?? t(`nav.${page}`) }}</h1>
    <p class="mt-4 text-ink-muted">{{ t('placeholder.soon') }}</p>
  </div>
</template>

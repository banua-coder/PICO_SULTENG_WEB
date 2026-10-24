<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageHead } from '@/app/head'
import { useLocale } from '@/app/useLocale'
import WikiContentEn from './WikiContent.en.vue'
import WikiContentId from './WikiContent.id.vue'

// Spec 72 / ADR-0102: the text lives in one SFC per language. Both are imported statically, so the prerender and the
// first client render pick the same one by the route's locale and hydrate without a mismatch.
const { t } = useI18n()
const { locale } = useLocale()
const Content = computed(() => (locale.value === 'en' ? WikiContentEn : WikiContentId))
usePageHead({ title: () => t('wiki.title'), description: () => t('wiki.description') })
</script>

<template>
  <div class="px-4 py-6">
    <h1 class="text-xl md:text-2xl">{{ t('wiki.heading') }}</h1>
    <component :is="Content" />
  </div>
</template>

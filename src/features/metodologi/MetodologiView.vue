<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageHead } from '@/app/head'
import { useLocale } from '@/app/useLocale'
import MetodologiContentEn from './MetodologiContent.en.vue'
import MetodologiContentId from './MetodologiContent.id.vue'

// Spec 74 / ADR-0102: one content SFC per language, both imported statically (same pick on the server and the client).
const { t } = useI18n()
const { locale } = useLocale()
const Content = computed(() => (locale.value === 'en' ? MetodologiContentEn : MetodologiContentId))
usePageHead({ title: () => t('metodologi.title'), description: () => t('metodologi.description') })
</script>

<template>
  <div class="px-5 py-8">
    <h1 class="text-2xl">{{ t('metodologi.heading') }}</h1>
    <component :is="Content" class="mt-8" />
  </div>
</template>

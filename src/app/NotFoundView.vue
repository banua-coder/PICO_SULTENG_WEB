<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import StatusView from '@/components/StatusView.vue'
import { usePageHead } from '@/app/head'
import { useLocale } from '@/app/useLocale'

const { t } = useI18n()
const { localize } = useLocale()
usePageHead({ title: () => t('notFound.title'), noindex: true })
const link = 'inline-flex min-h-touch items-center rounded-sm border border-line-strong bg-surface px-5 font-strong'
</script>

<template>
  <div class="mx-auto max-w-3xl px-5 py-8">
    <StatusView kind="not-found" heading="h1">
      <template #actions>
        <p class="w-full text-ink-muted">{{ t('notFound.body') }}</p>
        <RouterLink :to="localize('/')" :class="link">{{ t('notFound.home') }}</RouterLink>
        <RouterLink :to="localize('/data')" :class="link">{{ t('notFound.data') }}</RouterLink>
      </template>
    </StatusView>
  </div>
</template>

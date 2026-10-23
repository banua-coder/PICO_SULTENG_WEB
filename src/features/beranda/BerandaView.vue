<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePageHead } from '@/app/head'
import { useFormat } from '@/app/useFormat'

// Placeholder until W13. Keeps the h1 and a sample of the formatters.
const { t } = useI18n()
const fmt = useFormat()
usePageHead({ title: () => t('nav.beranda') })
</script>

<template>
  <div class="px-5 py-8">
    <h1 class="text-2xl">{{ t('app.name') }}</h1>
    <p class="mt-4">{{ t('app.tagline') }}, {{ fmt.range('2020-03-02', '2024-01-14') }}.</p>
    <p class="num mt-4 text-xl font-strong">{{ fmt.num(1234567) }}</p>
    <p class="mt-2">{{ fmt.nullable(null, fmt.num) }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import { useTheme } from '@/app/useTheme'

const { t } = useI18n()
const { theme, cycle } = useTheme()
const { switchPath, other } = useLocale()
const fmt = useFormat()
</script>

<template>
  <main id="konten" class="mx-auto max-w-3xl p-6">
    <h1 class="text-2xl">{{ t('app.name') }}</h1>
    <p class="mt-4">{{ t('app.tagline') }}, {{ fmt.range('2020-03-02', '2024-01-14') }}.</p>
    <p class="num mt-4 text-xl font-strong">{{ fmt.num(1234567) }}</p>
    <p class="mt-2">{{ fmt.nullable(null, fmt.num) }}</p>
    <div class="mt-6 rounded-md border border-line bg-tint p-5">Plakat di atas kapas polos.</div>
    <div class="mt-6 flex gap-3">
      <button type="button" class="rounded-sm bg-primary-strong px-5 py-3 text-on-primary" @click="cycle">
        {{ t('theme.label') }}: {{ theme }}
      </button>
      <a :href="switchPath" :hreflang="other" class="rounded-sm border border-line-strong px-5 py-3">{{ t('locale.switchTo') }}</a>
    </div>
  </main>
</template>

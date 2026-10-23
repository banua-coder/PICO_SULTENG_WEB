<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { FACTS } from '@/app/facts'
import { useFormat } from '@/app/useFormat'
import { useLocale } from '@/app/useLocale'
import cloth from '@/assets/brand/illustrations/pico-hero-tenun-kabupaten.svg?url'

const { t } = useI18n()
const f = useFormat()
const { localize } = useLocale()
</script>

<template>
  <section class="grid items-center gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
    <div>
      <h1 class="text-2xl">{{ t('beranda.heroTitle') }}</h1>
      <p class="mt-2 max-w-prose text-ink-muted" data-testid="archive-line">{{ t('beranda.archive', { range: f.range(FACTS.recordFirst, FACTS.recordLast) }) }}</p>
      <RouterLink :to="localize('/data')" class="mt-3 inline-flex min-h-touch items-center rounded-sm bg-primary-strong px-5 font-strong text-on-primary no-underline">{{ t('beranda.seeData') }}</RouterLink>
    </div>
    <!-- decoration: lazy, below the figures on a narrow screen (the layout puts it after them), never in the JavaScript -->
    <img :src="cloth" alt="" width="640" height="320" loading="lazy" decoding="async" aria-hidden="true" class="hidden h-auto w-full rounded-md lg:block">
  </section>
</template>

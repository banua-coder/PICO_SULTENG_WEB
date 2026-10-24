<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Banner } from '@/api/types'
import PicoImage from '@/components/PicoImage.vue'
import { Card } from '@/components/ui/card'

// Banners come from the old server: today every image is missing, so the title card is what shows (the designed missing-image state).
defineProps<{ banners: Banner[] }>()
const { t } = useI18n()
</script>

<template>
  <!-- a row to swipe on a phone (it keeps the first screen for the figures), two columns from sm -->
  <ul class="relative m-0 flex snap-x list-none gap-3 overflow-x-auto p-0 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible" data-testid="banners" :aria-label="t('beranda.bannersTitle')" tabindex="0">
    <li v-for="b in banners.slice(0, 2)" :key="b.id" class="flex w-4/5 shrink-0 snap-start sm:w-auto">
      <Card class="w-full gap-2 p-3">
        <!-- the pandemic banners' images were on a server that is gone: with no picture the card is just its title (the missing-image state) -->
        <div v-if="b.image" class="hidden sm:block"><PicoImage :src="b.image" :alt="b.title" ratio="16/9" /></div>
        <p class="m-0 font-semibold leading-snug">{{ b.title }}</p>
        <p class="m-0 text-xs text-ink-muted">{{ t('beranda.bannerOld') }}</p>
        <a v-if="b.href" :href="b.href" target="_blank" rel="noopener noreferrer" class="text-sm">{{ t('beranda.external') }}<span class="sr-only"> {{ b.title }} {{ t('contact.newTab') }}</span></a>
      </Card>
    </li>
  </ul>
</template>

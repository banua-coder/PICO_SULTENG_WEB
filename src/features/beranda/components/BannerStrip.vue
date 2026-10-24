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
  <ul class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2" data-testid="banners" :aria-label="t('beranda.bannersTitle')">
    <li v-for="b in banners.slice(0, 2)" :key="b.id" class="flex">
      <Card class="w-full gap-2 p-3">
        <PicoImage :src="b.image" :alt="b.title" ratio="16/9" />
        <p class="m-0 font-semibold">{{ b.title }}</p>
        <p class="m-0 text-xs text-ink-muted">{{ t('beranda.bannerOld') }}</p>
        <a v-if="b.href" :href="b.href" target="_blank" rel="noopener noreferrer" class="text-sm">{{ t('beranda.external') }}<span class="sr-only"> {{ b.title }} {{ t('contact.newTab') }}</span></a>
      </Card>
    </li>
  </ul>
</template>

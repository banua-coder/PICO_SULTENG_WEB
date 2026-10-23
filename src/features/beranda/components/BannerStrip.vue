<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Banner } from '@/api/types'
import PicoImage from '@/components/PicoImage.vue'

// Banners come from the old server: today every image is missing, so the title card is what shows (the designed missing-image state).
defineProps<{ banners: Banner[] }>()
const { t } = useI18n()
</script>

<template>
  <ul class="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3" data-testid="banners">
    <li v-for="b in banners" :key="b.id" class="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
      <PicoImage :src="b.image" :alt="b.title" ratio="16/9" />
      <p class="m-0 font-strong">{{ b.title }}</p>
      <a v-if="b.href" :href="b.href" target="_blank" rel="noopener noreferrer" class="text-sm">{{ t('beranda.external') }}<span class="sr-only"> {{ b.title }} {{ t('contact.newTab') }}</span></a>
    </li>
  </ul>
</template>

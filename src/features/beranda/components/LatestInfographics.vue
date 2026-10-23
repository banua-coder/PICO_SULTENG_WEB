<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Infographic } from '@/api/types'
import { useLocale } from '@/app/useLocale'
import PicoImage from '@/components/PicoImage.vue'

defineProps<{ items: Infographic[] }>()
const { t } = useI18n()
const { localize } = useLocale()
</script>

<template>
  <div>
    <ul class="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3 lg:grid-cols-5" data-testid="latest-infographics">
      <li v-for="i in items" :key="i.id">
        <RouterLink :to="`${localize('/infografis')}?id=${i.id}`" class="flex h-full flex-col gap-3 rounded-md border border-line bg-surface p-3 no-underline">
          <!-- decoration: the link is named by the title -->
          <div aria-hidden="true"><PicoImage :src="i.images[0] ?? null" :alt="i.title" ratio="4/5" /></div>
          <span class="font-strong text-ink">{{ i.title }}</span>
          <span class="text-sm text-ink-muted">{{ t('beranda.infoCount', { n: i.images.length }) }}</span>
        </RouterLink>
      </li>
    </ul>
    <p class="mt-4"><RouterLink :to="localize('/infografis')">{{ t('beranda.infoMore') }}</RouterLink></p>
  </div>
</template>

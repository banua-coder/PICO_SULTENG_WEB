<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRight, Code2, Phone, Smartphone } from '@lucide/vue'
import type { Banner } from '@/api/types'
import { useLocale } from '@/app/useLocale'
import { Card } from '@/components/ui/card'
import BannerStrip from './BannerStrip.vue'

// The old PICO home top: the banners on the left, the emergency call cards on the right. The new "Mulai" cards (API and app) sit with the call cards.
defineProps<{ banners: Banner[] }>()
const { t } = useI18n()
const { localize } = useLocale()
const card = 'flex min-h-touch items-center gap-3 p-4 text-ink no-underline hover:bg-accent'
</script>

<template>
  <div class="grid gap-4 xl:grid-cols-2">
    <BannerStrip v-if="banners.length" :banners="banners" />
    <div class="grid content-start gap-3" :class="banners.length ? '' : 'xl:col-span-2 md:grid-cols-3'">
      <Card class="py-0">
        <a href="tel:119" :class="card">
          <Phone class="size-6 text-active" aria-hidden="true" />
          <span class="flex-1 leading-tight">
            <span class="block text-lg font-bold">{{ t('beranda.callCenter') }}</span>
            <span class="block text-sm text-ink-muted">{{ t('beranda.callCenterNote') }}</span>
          </span>
          <span class="num text-2xl font-bold text-primary-strong" data-testid="call-center">119</span>
        </a>
      </Card>
      <Card class="py-0">
        <RouterLink :to="`${localize('/mulai')}#api`" :class="card">
          <Code2 class="size-6 text-active" aria-hidden="true" />
          <span class="flex-1 text-lg font-bold leading-tight">{{ t('beranda.startApi') }}</span>
          <ArrowRight class="size-5 text-ink-muted" aria-hidden="true" />
        </RouterLink>
      </Card>
      <Card class="py-0">
        <RouterLink :to="`${localize('/mulai')}#aplikasi`" :class="card">
          <Smartphone class="size-6 text-active" aria-hidden="true" />
          <span class="flex-1 text-lg font-bold leading-tight">{{ t('beranda.startApp') }}</span>
          <ArrowRight class="size-5 text-ink-muted" aria-hidden="true" />
        </RouterLink>
      </Card>
    </div>
  </div>
</template>

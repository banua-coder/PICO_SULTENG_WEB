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
const card = 'flex h-full min-h-touch flex-col items-center justify-center gap-1 p-3 text-center text-ink no-underline hover:bg-accent sm:flex-row sm:justify-start sm:gap-3 sm:p-4 sm:text-left'
</script>

<template>
  <div class="grid gap-4 xl:grid-cols-2">
    <BannerStrip v-if="banners.length" :banners="banners" />
    <!-- three tiles in a row on a phone (the figures stay near the top), a column of wide cards from sm -->
    <div class="grid grid-cols-3 content-start gap-3 sm:grid-cols-1" :class="banners.length ? '' : 'xl:col-span-2 sm:grid-cols-3'">
      <Card class="py-0">
        <a href="tel:119" :class="card">
          <Phone class="size-6 text-active" aria-hidden="true" />
          <span class="leading-tight sm:flex-1">
            <span class="block text-sm font-bold sm:text-lg">{{ t('beranda.callCenter') }}</span>
            <span class="hidden text-sm text-ink-muted sm:block">{{ t('beranda.callCenterNote') }}</span>
          </span>
          <span class="num text-xl font-bold text-primary-strong sm:text-2xl" data-testid="call-center">119</span>
        </a>
      </Card>
      <Card class="py-0">
        <RouterLink :to="`${localize('/mulai')}#api`" :class="card">
          <Code2 class="size-6 text-active" aria-hidden="true" />
          <span class="text-sm font-bold leading-tight sm:flex-1 sm:text-lg"><span class="sm:hidden">{{ t('beranda.startApiShort') }}</span><span class="hidden sm:inline">{{ t('beranda.startApi') }}</span></span>
          <ArrowRight class="hidden size-5 text-ink-muted sm:block" aria-hidden="true" />
        </RouterLink>
      </Card>
      <Card class="py-0">
        <RouterLink :to="`${localize('/mulai')}#aplikasi`" :class="card">
          <Smartphone class="size-6 text-active" aria-hidden="true" />
          <span class="text-sm font-bold leading-tight sm:flex-1 sm:text-lg"><span class="sm:hidden">{{ t('beranda.startAppShort') }}</span><span class="hidden sm:inline">{{ t('beranda.startApp') }}</span></span>
          <ArrowRight class="hidden size-5 text-ink-muted sm:block" aria-hidden="true" />
        </RouterLink>
      </Card>
    </div>
  </div>
</template>

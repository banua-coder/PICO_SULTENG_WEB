<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRight, Code2, Phone, PhoneCall, Smartphone } from '@lucide/vue'
import type { Banner } from '@/api/types'
import { useLocale } from '@/app/useLocale'
import { Card } from '@/components/ui/card'
import Illustration from '@/components/Illustration.vue'
import BannerStrip from './BannerStrip.vue'

// The old PICO home top: the banners on the left, the emergency call cards (Call Center 119, Hotline Dinkes Sulteng) and the social card on the
// right (legacy CardCallCenter and DonationSection). The new "Mulai" cards (API and app) sit with them. The Hotline number is from the pandemic: it is
// shown as text with that note, not as a link to a number that may no longer answer. On a phone the social card is left out of the top (the
// figures stay on the second screen); the footer carries the social links there.
const SOCIAL = [
  { key: 'instagram', href: 'https://instagram.com/sultenglawancovid', label: 'Instagram' },
  { key: 'x', href: 'https://x.com/SultengVsCovid', label: 'X (Twitter)' },
] as const
defineProps<{ banners: Banner[] }>()
const { t } = useI18n()
const { localize } = useLocale()
const card = 'flex h-full min-h-touch flex-col items-center justify-center gap-1 p-3 text-center text-ink no-underline hover:bg-accent sm:flex-row sm:justify-start sm:gap-3 sm:p-4 sm:text-left'
</script>

<template>
  <div class="grid gap-4 xl:grid-cols-2">
    <BannerStrip v-if="banners.length" :banners="banners" />
    <!-- three tiles in a row on a phone (the figures stay near the top), a column of wide cards from sm -->
    <div class="grid grid-cols-2 content-start gap-3 sm:grid-cols-1" :class="banners.length ? '' : 'xl:col-span-2 sm:grid-cols-2'">
      <Card class="py-0">
        <a href="tel:119" :class="card">
          <Phone class="size-6 text-active sm:hidden" aria-hidden="true" />
          <Illustration class="hidden shrink-0 sm:block" name="telepon-119" :width="72" />
          <span class="leading-tight sm:flex-1">
            <span class="block text-sm font-bold sm:text-lg">{{ t('beranda.callCenter') }}</span>
            <span class="hidden text-sm text-ink-muted sm:block">{{ t('beranda.callCenterNote') }}</span>
          </span>
          <span class="num text-xl font-bold text-primary-strong sm:text-2xl" data-testid="call-center">119</span>
        </a>
      </Card>
      <Card class="py-0" data-testid="hotline">
        <a href="tel:+62811404119" :class="card">
          <PhoneCall class="size-6 text-active" aria-hidden="true" />
          <span class="leading-tight sm:flex-1">
            <span class="block text-sm font-bold sm:text-lg">{{ t('beranda.hotline') }}</span>
            <span class="block text-xs text-ink-muted sm:text-sm">{{ t('beranda.hotlineNote') }}</span>
          </span>
          <span class="num text-sm font-bold text-ink sm:text-lg">+62811-404-119</span>
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
      <Card class="col-span-2 hidden py-0 sm:col-span-1 sm:block" data-testid="social-card">
        <div class="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p class="m-0 text-sm sm:max-w-[60%]">{{ t('beranda.socialText') }}</p>
          <ul class="m-0 flex list-none gap-2 p-0">
            <li v-for="s in SOCIAL" :key="s.key"><a :href="s.href" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-touch items-center rounded-md border px-3 font-semibold no-underline">{{ s.label }}<span class="sr-only"> {{ t('contact.newTab') }}</span></a></li>
          </ul>
        </div>
      </Card>
    </div>
  </div>
</template>

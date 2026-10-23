<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import lockup from '@/assets/brand/logo/pico-lockup-horizontal-color.svg'
import lockupDark from '@/assets/brand/logo/pico-lockup-horizontal-color-dark.svg'
import { isNavActive, NAV_ITEMS, navTo } from '@/app/nav'
import type { NavItem } from '@/app/nav'
import { useLocale } from '@/app/useLocale'
import AppNav from './AppNav.vue'
import LocaleSwitch from './LocaleSwitch.vue'
import ThemeSwitch from './ThemeSwitch.vue'

const { t } = useI18n()
const route = useRoute()
const { locale, localize } = useLocale()
const items = computed<NavItem[]>(() =>
  NAV_ITEMS.map((i) => ({ key: i.key, to: navTo(i.path, locale.value), label: t(`nav.${i.key}`), active: isNavActive(i.path, route.path) })),
)
</script>

<template>
  <header class="border-b border-line bg-surface">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-3">
      <RouterLink :to="localize('/')" class="inline-flex min-h-touch items-center" :aria-label="t('app.homeLink')">
        <img :src="lockup" alt="" width="203" height="48" class="logo-light h-8 w-auto" decoding="async">
        <img :src="lockupDark" alt="" width="203" height="48" class="logo-dark h-8 w-auto" loading="lazy" decoding="async">
      </RouterLink>
      <div class="flex flex-wrap items-center gap-3">
        <LocaleSwitch />
        <ThemeSwitch />
      </div>
      <div class="w-full"><AppNav :items="items" /></div>
    </div>
  </header>
</template>

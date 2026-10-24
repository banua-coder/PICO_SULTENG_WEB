<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Smartphone } from '@lucide/vue'
import mark from '@/assets/brand/logo/pico-mark-color.svg'
import markDark from '@/assets/brand/logo/pico-mark-color-dark.svg'
import { isNavActive, NAV_ITEMS, navTo } from '@/app/nav'
import type { NavItem } from '@/app/nav'
import { useLocale } from '@/app/useLocale'
import { Button } from '@/components/ui/button'
import AppNav from './AppNav.vue'
import LocaleSwitch from './LocaleSwitch.vue'
import MobileTabBar from './MobileTabBar.vue'
import ThemeSwitch from './ThemeSwitch.vue'

const { t } = useI18n()
const route = useRoute()
const { locale, localize } = useLocale()
const items = computed<NavItem[]>(() =>
  NAV_ITEMS.map((i) => ({ key: i.key, to: navTo(i.path, locale.value), label: t(`nav.${i.key}`), active: isNavActive(i.path, route.path), primary: i.primary, tab: i.tab })),
)
</script>

<template>
  <header class="sticky top-0 z-40 bg-surface shadow-card">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
      <RouterLink :to="localize('/')" class="flex min-h-touch min-w-0 items-center gap-3 text-ink no-underline" :aria-label="t('app.homeLink')">
        <img :src="mark" alt="" width="40" height="40" class="logo-light size-8 md:size-10" decoding="async">
        <img :src="markDark" alt="" width="40" height="40" class="logo-dark size-8 md:size-10" decoding="async">
        <span class="min-w-0 leading-tight">
          <span class="block truncate text-xs font-semibold md:text-lg">{{ t('app.titleLine1') }}</span>
          <span class="block truncate text-xs md:text-sm">{{ t('app.titleLine2') }}</span>
        </span>
      </RouterLink>
      <div class="flex shrink-0 items-center gap-2">
        <AppNav :items="items" class="hidden xl:block" />
        <Button as-child class="hidden xl:inline-flex">
          <RouterLink :to="`${localize('/mulai')}#aplikasi`" class="text-on-primary no-underline"><Smartphone aria-hidden="true" />{{ t('nav.download') }}</RouterLink>
        </Button>
        <LocaleSwitch />
        <ThemeSwitch />
      </div>
    </div>
    <MobileTabBar :items="items" />
  </header>
</template>

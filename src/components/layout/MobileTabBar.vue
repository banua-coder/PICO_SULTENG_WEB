<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { BarChart3, Ellipsis, Home, Phone } from '@lucide/vue'
import type { NavItem, NavKey } from '@/app/nav'

// The old PICO phone layout: a dark bar at the bottom with Beranda, Data, Kontak and "Lainnya". "Lainnya" opens the other pages in a sheet.
const props = defineProps<{ items: NavItem[] }>()
const { t } = useI18n()
const route = useRoute()
// the sheet (dialog code) loads when "Lainnya" is first pressed, so the phone's first load does not carry it
const MoreSheet = defineAsyncComponent(() => import('./MoreSheet.vue'))
const open = ref(false)
const loaded = ref(false)
const ICON: Partial<Record<NavKey, Component>> = { beranda: Home, data: BarChart3, kontak: Phone }
const tabs = computed(() => props.items.filter((i) => i.tab))
const rest = computed(() => props.items.filter((i) => !i.tab))
watch(() => route.fullPath, () => (open.value = false))
const tab = 'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 px-1 text-xs font-semibold no-underline'
</script>

<template>
  <nav :aria-label="t('nav.labelMobile')" class="focus-on-fill fixed inset-x-0 bottom-0 z-40 bg-bar pb-[env(safe-area-inset-bottom)] xl:hidden">
    <ul class="m-0 flex list-none p-0">
      <li v-for="item in tabs" :key="item.key" class="flex flex-1">
        <RouterLink :to="item.to" :aria-current="item.active ? 'page' : undefined" :class="[tab, item.active ? 'border-sky text-on-bar-active' : 'border-transparent text-on-bar']">
          <component :is="ICON[item.key]" class="size-5" aria-hidden="true" />{{ item.label }}
        </RouterLink>
      </li>
      <li class="flex flex-1">
        <button type="button" :class="[tab, 'border-transparent bg-transparent text-on-bar']" :aria-expanded="open" aria-haspopup="dialog" @click="(loaded = true), (open = true)">
          <Ellipsis class="size-5" aria-hidden="true" />{{ t('nav.more') }}
        </button>
      </li>
    </ul>
    <MoreSheet v-if="loaded" v-model:open="open" :items="rest" />
  </nav>
</template>

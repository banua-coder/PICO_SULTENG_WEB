<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Smartphone } from '@lucide/vue'
import type { NavItem } from '@/app/nav'
import { useLocale } from '@/app/useLocale'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// The rest of the pages, as a bottom sheet (shadcn Sheet on reka-ui Dialog: focus trap, Escape, focus return).
defineProps<{ items: NavItem[] }>()
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const { localize } = useLocale()
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent side="bottom" class="max-h-[85dvh] overflow-y-auto rounded-t-xl">
      <SheetHeader>
        <SheetTitle>{{ t('nav.menu') }}</SheetTitle>
        <SheetDescription class="sr-only">{{ t('nav.label') }}</SheetDescription>
      </SheetHeader>
      <ul class="m-0 flex list-none flex-col px-4 pb-4">
        <li v-for="item in items" :key="item.key" class="border-b border-line last:border-0">
          <RouterLink :to="item.to" :aria-current="item.active ? 'page' : undefined" class="flex min-h-touch items-center px-1 font-semibold text-ink no-underline" :class="item.active ? 'text-primary-strong' : ''">{{ item.label }}</RouterLink>
        </li>
      </ul>
      <div class="px-4 pb-6">
        <Button as-child class="w-full">
          <RouterLink :to="`${localize('/mulai')}#aplikasi`" class="text-on-primary no-underline"><Smartphone aria-hidden="true" />{{ t('nav.download') }}</RouterLink>
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>

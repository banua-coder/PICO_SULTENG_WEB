<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from '@lucide/vue'
import type { NavItem } from '@/app/nav'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// The top bar of the old PICO site: text links, the active one with a blue underline. Items that did not fit the old bar sit under "Lainnya".
const props = defineProps<{ items: NavItem[] }>()
const { t } = useI18n()
const primary = computed(() => props.items.filter((i) => i.primary))
const more = computed(() => props.items.filter((i) => !i.primary))
const link = 'inline-flex min-h-touch items-center border-b-2 px-2.5 text-sm font-semibold no-underline'
</script>

<template>
  <nav :aria-label="t('nav.label')">
    <ul class="m-0 flex list-none items-center gap-1 p-0">
      <li v-for="item in primary" :key="item.key">
        <RouterLink
          :to="item.to"
          :aria-current="item.active ? 'page' : undefined"
          :class="[link, item.active ? 'border-primary text-primary-strong' : 'border-transparent text-ink-muted hover:border-primary hover:text-ink']"
        >
          {{ item.label }}
        </RouterLink>
      </li>
      <li>
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="ghost" class="text-sm font-semibold text-ink-muted" :class="more.some((i) => i.active) ? 'text-primary-strong' : ''">
              {{ t('nav.more') }}<ChevronDown aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" class="w-56 p-2">
            <ul class="m-0 flex list-none flex-col p-0">
              <li v-for="item in more" :key="item.key">
                <RouterLink
                  :to="item.to"
                  :aria-current="item.active ? 'page' : undefined"
                  class="flex min-h-touch items-center rounded-md px-3 text-sm font-semibold text-ink no-underline hover:bg-accent"
                  :class="item.active ? 'bg-accent text-primary-strong' : ''"
                >
                  {{ item.label }}
                </RouterLink>
              </li>
            </ul>
          </PopoverContent>
        </Popover>
      </li>
    </ul>
  </nav>
</template>

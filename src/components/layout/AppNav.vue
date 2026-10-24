<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from '@lucide/vue'
import type { NavItem } from '@/app/nav'
import { Button } from '@/components/ui/button'

// The top bar of the old PICO site: text links, the active one with a blue underline. Pages that did not fit the old bar sit under "Lainnya".
// That small menu is plain markup (no popover library): the top bar is in every page's first load.
const props = defineProps<{ items: NavItem[] }>()
const { t } = useI18n()
const route = useRoute()
const primary = computed(() => props.items.filter((i) => i.primary))
const more = computed(() => props.items.filter((i) => !i.primary))
const open = ref(false)
const root = ref<HTMLElement>()
const listId = useId()
const close = (returnFocus = false) => {
  open.value = false
  if (returnFocus) root.value?.querySelector('button')?.focus()
}
const onDocClick = (e: MouseEvent) => {
  if (open.value && root.value && !root.value.contains(e.target as Node)) close()
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
// a navigation closes the menu
watch(() => route.fullPath, () => close())
const link = 'inline-flex min-h-touch items-center border-b-2 px-2.5 text-sm font-semibold no-underline'
</script>

<template>
  <nav :aria-label="t('nav.label')" @keydown.esc="open && close(true)">
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
      <li ref="root" class="relative">
        <Button variant="ghost" class="text-sm font-semibold" :class="more.some((i) => i.active) ? 'text-primary-strong' : 'text-ink-muted'" aria-haspopup="true" :aria-expanded="open" :aria-controls="listId" @click="open = !open">
          {{ t('nav.more') }}<ChevronDown aria-hidden="true" />
        </Button>
        <ul v-show="open" :id="listId" class="absolute right-0 top-full z-50 m-0 mt-1 flex w-56 list-none flex-col rounded-md border bg-popover p-2 shadow-md">
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
      </li>
    </ul>
  </nav>
</template>

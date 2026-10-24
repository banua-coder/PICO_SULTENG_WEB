<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { NavItem } from '@/app/nav'

defineProps<{ items: NavItem[] }>()

const { t } = useI18n()
const route = useRoute()
const open = ref(false)
const button = ref<HTMLButtonElement>()
const listId = useId()

function close(returnFocus: boolean) {
  open.value = false
  if (returnFocus) void nextTick(() => button.value?.focus())
}
// a navigation closes the menu (focus then belongs to the new page heading)
watch(() => route.fullPath, () => (open.value = false))
</script>

<template>
  <nav :aria-label="t('nav.label')" @keydown.esc="open && close(true)">
    <button
      ref="button"
      type="button"
      class="inline-flex min-h-touch items-center rounded-sm border border-line-strong bg-surface px-4 text-sm font-strong text-ink md:hidden"
      :aria-expanded="open"
      :aria-controls="listId"
      @click="open = !open"
    >
      {{ t('nav.menu') }}
    </button>
    <ul :id="listId" class="m-0 list-none flex-col gap-2 p-0 pt-3 md:flex md:flex-row md:flex-wrap md:pt-0" :class="open ? 'flex' : 'hidden'">
      <li v-for="item in items" :key="item.key">
        <RouterLink
          :to="item.to"
          :aria-current="item.active ? 'page' : undefined"
          class="inline-flex min-h-touch items-center rounded-sm px-4 text-ink no-underline"
          :class="item.active ? 'border-b-2 border-indigo font-strong text-indigo' : 'hover:bg-tint'"
        >
          {{ item.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

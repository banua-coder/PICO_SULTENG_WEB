<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ level: 2 | 3; id: string }>()
const { t } = useI18n()
</script>

<template>
  <component :is="`h${level}`" :id="id" class="group flex scroll-mt-6 items-center gap-2" :class="level === 2 ? 'text-xl' : 'text-lg'">
    <slot />
    <a
      :href="`#${id}`"
      class="inline-flex min-h-touch min-w-touch items-center justify-center rounded-sm text-primary-strong no-underline opacity-60 hover:opacity-100 focus-visible:opacity-100"
      :aria-label="t('heading.link')"
    >
      <span aria-hidden="true">#</span>
    </a>
  </component>
</template>

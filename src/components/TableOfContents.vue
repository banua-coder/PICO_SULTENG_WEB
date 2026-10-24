<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// Anchor list for a long page (Wiki, Metodologi). Wide screens sit it in a sticky side column from the page.
defineProps<{ items: { id: string; label: string }[] }>()
const { t } = useI18n()
</script>

<template>
  <nav :aria-label="t('toc.label')">
    <p class="font-display text-md font-heading text-ink">{{ t('toc.title') }}</p>
    <ol class="m-0 mt-2 list-none p-0">
      <li v-for="i in items" :key="i.id"><a :href="`#${i.id}`" class="inline-flex min-h-touch items-center">{{ i.label }}</a></li>
    </ol>
  </nav>
</template>

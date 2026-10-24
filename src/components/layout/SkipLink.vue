<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// A plain #hash jump scrolls but does not always move focus (the router also handles hash changes). Do both.
function jump() {
  const main = document.getElementById('konten')
  main?.focus()
  main?.scrollIntoView()
}
</script>

<template>
  <a
    href="#konten"
    class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:inline-flex focus:min-h-touch focus:items-center focus:rounded-sm focus:bg-indigo focus:px-4 focus:text-on-indigo"
    @click.prevent="jump"
  >
    {{ t('app.skip') }}
  </a>
</template>

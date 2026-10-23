<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePageHead } from '@/app/head'
import StatusView from '@/components/StatusView.vue'
import InfographicCard from './components/InfographicCard.vue'
import InfographicViewer from './components/InfographicViewer.vue'
import { useInfografisPage } from './useInfografisPage'

// Spec 70. The list is large and its images are on other hosts, so it loads after hydration (never prerendered).
const { t } = useI18n()
const s = useInfografisPage()
usePageHead({ title: () => t('infografis.title'), description: () => t('infografis.description') })
</script>

<template>
  <div class="px-5 py-8">
    <h1 class="text-2xl">{{ t('infografis.title') }}</h1>
    <p class="mt-3 max-w-prose text-ink-muted">{{ t('infografis.intro') }}</p>
    <StatusView v-if="s.list.status.value === 'error'" class="mt-8" kind="error" @retry="s.list.refresh()" />
    <StatusView v-else-if="!s.list.data.value" class="mt-8" kind="loading" />
    <StatusView v-else-if="s.list.data.value.length === 0" class="mt-8" kind="empty" :title="t('infografis.empty')" />
    <template v-else>
      <div class="mt-6 flex flex-col gap-2">
        <label for="infografis-q" class="text-sm font-strong text-ink-muted">{{ t('infografis.searchLabel') }}</label>
        <input id="infografis-q" v-model="s.q.value" type="search" autocomplete="off" :placeholder="t('infografis.searchPlaceholder')" class="min-h-touch max-w-md rounded-sm border border-line-strong bg-surface px-4 text-ink">
      </div>
      <p role="status" aria-live="polite" class="mt-4 text-sm text-ink-muted">{{ t('infografis.shown', { shown: s.visible.value.length, total: s.total.value }) }}</p>
      <p v-if="s.total.value === 0" class="mt-4">{{ t('infografis.noMatch') }}</p>
      <ul data-testid="infografis-grid" class="mt-4 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3 lg:grid-cols-4">
        <li v-for="i in s.visible.value" :key="i.id">
          <InfographicCard :item="i" @open="s.openItem(i.id)" />
        </li>
      </ul>
      <button v-if="s.visible.value.length < s.total.value" type="button" class="mt-6 min-h-touch rounded-sm bg-primary-strong px-5 text-on-primary" @click="s.more()">{{ t('infografis.more') }}</button>
    </template>
    <InfographicViewer :item="s.open.value" @close="s.close()" />
  </div>
</template>

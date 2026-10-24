<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/app/useLocale'

const { t } = useI18n()
const { localize } = useLocale()
// the tip illustrations arrive after hydration, in a chunk of their own; their box is reserved
const Tips = shallowRef<Component | null>(null)
onMounted(async () => (Tips.value = (await import('./HomeTips.vue')).default))
</script>

<template>
  <div class="grid gap-8">
    <section aria-labelledby="darurat" class="rounded-md border-2 border-indigo bg-tint p-5">
      <h3 id="darurat" class="text-lg">{{ t('beranda.callTitle') }}</h3>
      <p class="m-0 mt-2 font-strong" data-testid="call-center">{{ t('beranda.callText') }} <a href="tel:119">119</a></p>
      <p class="m-0 mt-2 text-sm text-ink-muted">{{ t('beranda.callArchive') }}</p>
    </section>
    <section aria-labelledby="gejala-home">
      <h3 id="gejala-home" class="text-lg">{{ t('beranda.symptomsTitle') }}</h3>
      <p class="mt-2 max-w-prose">{{ t('beranda.symptomsText') }}</p>
    </section>
    <section aria-labelledby="tips-home">
      <h3 id="tips-home" class="text-lg">{{ t('beranda.tipsTitle') }}</h3>
      <div class="mt-3 min-h-[14rem]"><component :is="Tips" v-if="Tips" /></div>
    </section>
    <p class="m-0 flex flex-wrap gap-5">
      <RouterLink :to="localize('/wiki')">{{ t('beranda.wikiLink') }}</RouterLink>
      <RouterLink :to="localize('/isoman')">{{ t('beranda.isomanLink') }}</RouterLink>
    </p>
  </div>
</template>

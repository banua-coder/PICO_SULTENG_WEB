<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import Illustration from '@/components/Illustration.vue'

// The four cards at the top of the old Isolation page (legacy `informations`): picture, title, text, one blue button. A service that is gone
// (`inactive`) keeps its card and says so instead of linking to a dead form.
export type Cta = { key: string; title: string; text: string; label: string; href?: string; external?: boolean; art?: string; image?: string; inactive?: string }
defineProps<{ items: Cta[] }>()
</script>

<template>
  <ul class="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2" data-testid="isoman-ctas">
    <li v-for="c in items" :key="c.key" class="flex flex-row flex-wrap gap-3 rounded-lg bg-card p-4 shadow-lg" :data-cta="c.key">
      <div class="flex w-full items-center justify-center lg:w-2/5">
        <Illustration v-if="c.art" :name="c.art" :width="200" />
        <img v-else-if="c.image" :src="c.image" alt="" width="200" height="200" loading="lazy" decoding="async" class="h-auto w-48 max-w-full object-contain">
      </div>
      <div class="flex w-full flex-col justify-between lg:w-[calc(60%-0.75rem)]">
        <h3 class="m-0 text-base font-bold">{{ c.title }}</h3>
        <p class="my-4 mt-2">{{ c.text }}</p>
        <p v-if="c.inactive" class="m-0 rounded-lg border border-line-strong p-2 text-sm font-semibold text-ink-muted" data-inactive>{{ c.inactive }}</p>
        <a v-else :href="c.href" :target="c.external ? '_blank' : undefined" :rel="c.external ? 'noopener noreferrer' : undefined" class="flex w-full items-center justify-between rounded-lg bg-primary p-2 font-bold text-on-primary no-underline transition-all duration-150 hover:bg-primary-hover hover:text-on-primary">
          <span>{{ c.label }}<span v-if="c.external" class="sr-only"> {{ $t('contact.newTab') }}</span></span>
          <ArrowRight class="size-5" aria-hidden="true" />
        </a>
      </div>
    </li>
  </ul>
</template>

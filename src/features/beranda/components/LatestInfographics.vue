<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Infographic } from '@/api/types'
import { useLocale } from '@/app/useLocale'
import { Button } from '@/components/ui/button'
import PicoImage from '@/components/PicoImage.vue'

defineProps<{ items: Infographic[] }>()
const { t } = useI18n()
const { localize } = useLocale()
// The pictures sit on other hosts. A tile whose cover cannot load collapses to its title and count: no broken-image box.
const failed = ref(new Set<number>())
const fail = (id: number) => (failed.value = new Set(failed.value).add(id))
</script>

<template>
  <div>
    <ul class="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-5" data-testid="latest-infographics">
      <li v-for="i in items" :key="i.id">
        <RouterLink :to="`${localize('/infografis')}?id=${i.id}`" class="flex h-full flex-col gap-2 rounded-lg border bg-card p-2 text-card-foreground no-underline shadow-card hover:bg-accent">
          <!-- decoration: the link is named by the title -->
          <div v-if="!failed.has(i.id)" aria-hidden="true"><PicoImage :src="i.images[0] ?? null" :alt="i.title" ratio="4/5" @failed="fail(i.id)" /></div>
          <span class="font-semibold text-ink">{{ i.title }}</span>
          <span class="text-sm text-ink-muted">{{ t('beranda.infoCount', { n: i.images.length }) }}</span>
        </RouterLink>
      </li>
    </ul>
    <p class="mb-0 mt-4 text-center"><Button as-child variant="outline"><RouterLink :to="localize('/infografis')" class="text-primary-strong no-underline">{{ t('beranda.infoMore') }}</RouterLink></Button></p>
  </div>
</template>

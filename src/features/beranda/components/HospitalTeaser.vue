<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Hospital } from '@/api/types'
import { useLocale } from '@/app/useLocale'
import { Button } from '@/components/ui/button'
import ContactLink from '@/components/ContactLink.vue'
import { dailyPick, jakartaDay } from '../useBeranda'

// 3 hospitals picked by the day. The prerender and the first client render use the build day (so they match), then the real day takes over.
const props = defineProps<{ hospitals: Hospital[] }>()
const { t } = useI18n()
const { localize } = useLocale()
const day = ref(__BUILD_DAY__)
onMounted(() => (day.value = jakartaDay()))
</script>

<template>
  <div>
    <ul class="m-0 grid list-none gap-3 p-0 md:grid-cols-3" data-testid="hospital-teaser">
      <li v-for="h in dailyPick(props.hospitals, day)" :key="h.code" class="rounded-lg border bg-card p-4 text-card-foreground shadow-card">
        <p class="m-0 font-semibold">{{ h.name }}</p>
        <p v-if="h.kabupaten" class="m-0 text-sm text-ink-muted">{{ h.kabupaten.name }}</p>
        <p v-if="h.address" class="m-0 mt-1 text-sm">{{ h.address }}</p>
        <ContactLink v-if="h.contacts[0]" :contact="h.contacts[0]" />
      </li>
    </ul>
    <p class="mb-0 mt-4 text-center"><Button as-child variant="outline"><RouterLink :to="localize('/kontak')" class="text-primary-strong no-underline">{{ t('beranda.hospitalsMore') }}</RouterLink></Button></p>
  </div>
</template>

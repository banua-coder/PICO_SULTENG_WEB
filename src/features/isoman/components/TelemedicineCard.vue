<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Telemedicine } from '@/api/types'
import ContactLink from '@/components/ContactLink.vue'

defineProps<{ item: Telemedicine }>()
const { t } = useI18n()
const id = useId()
</script>

<template>
  <article :aria-labelledby="id" class="flex flex-col gap-2 rounded-lg border bg-card text-card-foreground shadow-card p-4">
    <h3 :id="id" class="text-lg">{{ item.name }} <span class="text-sm font-normal text-ink-muted">({{ item.free ? t('isoman.free') : t('isoman.paid') }})</span></h3>
    <ul v-if="item.contacts.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="(c, i) in item.contacts" :key="i"><ContactLink :contact="c" /></li>
    </ul>
    <table v-if="item.schedules.length" class="w-full border-collapse text-sm">
      <caption class="pb-0.5 text-left font-strong">{{ t('isoman.schedule') }}</caption>
      <thead class="sr-only"><tr><th scope="col">{{ t('isoman.scheduleDay') }}</th><th scope="col">{{ t('isoman.scheduleTime') }}</th></tr></thead>
      <tbody>
        <tr v-for="(s, i) in item.schedules" :key="i" class="border-t border-line">
          <td class="py-0.5 pr-2">{{ s.days }}</td>
          <td class="py-0.5 tabular-nums">{{ s.hours }} {{ s.tz }}</td>
        </tr>
      </tbody>
    </table>
  </article>
</template>

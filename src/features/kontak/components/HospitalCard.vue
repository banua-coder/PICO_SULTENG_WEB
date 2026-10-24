<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Hospital } from '@/api/types'
import ContactLink from '@/components/ContactLink.vue'
import { osmUrl } from '../useKontakPage'
import BedTable from './BedTable.vue'

const props = defineProps<{ hospital: Hospital }>()
const { t } = useI18n()
const id = useId()
const map = computed(() => osmUrl(props.hospital.location))
</script>

<template>
  <article :aria-labelledby="id" class="flex flex-col gap-4 rounded-md border border-line bg-surface p-5">
    <header>
      <h3 :id="id" class="text-lg">{{ hospital.name }}</h3>
      <p v-if="hospital.kabupaten" class="m-0 text-sm text-ink-muted">{{ hospital.kabupaten.name }}</p>
    </header>
    <p v-if="hospital.address" class="m-0">{{ hospital.address }}</p>
    <ul v-if="hospital.contacts.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="(c, i) in hospital.contacts" :key="i"><ContactLink :contact="c" /></li>
    </ul>
    <p class="m-0 text-sm text-ink-muted">{{ t('kontak.igd', { n: hospital.igdCount }) }}</p>
    <BedTable v-if="hospital.beds.length" :hospital="hospital" />
    <p v-else class="m-0 text-sm text-ink-muted">{{ t('kontak.noBeds') }}</p>
    <a v-if="map" :href="map" target="_blank" rel="noopener noreferrer">{{ t('kontak.map') }}<span class="sr-only"> {{ hospital.name }} {{ t('contact.newTab') }}</span></a>
  </article>
</template>

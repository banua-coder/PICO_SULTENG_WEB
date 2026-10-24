<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TaskForceGroup } from '@/api/types'
import ContactLink from '@/components/ContactLink.vue'

defineProps<{ groups: TaskForceGroup[] }>()
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-6">
    <section v-for="g in groups" :key="g.kabupaten.code" :aria-labelledby="`tf-${g.kabupaten.code}`">
      <h3 :id="`tf-${g.kabupaten.code}`" class="text-lg">{{ g.kabupaten.name }}</h3>
      <ul class="m-0 mt-2 flex list-none flex-col gap-3 p-0">
        <li v-for="(m, i) in g.members" :key="i" class="rounded-lg border bg-card text-card-foreground shadow-card p-3">
          <p class="m-0 font-strong">{{ m.name }}</p>
          <ul v-if="m.contacts.length" class="m-0 flex list-none flex-col p-0">
            <li v-for="(c, j) in m.contacts" :key="j"><ContactLink :contact="c" /></li>
          </ul>
          <p v-else class="m-0 text-sm text-ink-muted">{{ t('kontak.noContacts') }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>

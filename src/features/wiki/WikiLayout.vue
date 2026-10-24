<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ArchiveNotice from '@/components/ArchiveNotice.vue'
import ProseLayout from '@/components/ProseLayout.vue'

// The frame of the Wiki: dated note, then the shared prose layout.
defineProps<{ items: { id: string; label: string }[] }>()
const { t } = useI18n()
</script>

<template>
  <ArchiveNotice class="mt-4">
    <p class="m-0">{{ t('wiki.note') }}</p>
  </ArchiveNotice>
  <ProseLayout class="mt-12" :items="items">
    <slot />
    <p class="mt-12 text-sm text-ink-muted">{{ t('wiki.source') }} <a href="https://pikobar.jabarprov.go.id" rel="noopener">pikobar.jabarprov.go.id</a></p>
  </ProseLayout>
</template>

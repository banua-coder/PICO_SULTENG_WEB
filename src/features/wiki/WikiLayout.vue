<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ArchiveNotice from '@/components/ArchiveNotice.vue'
import ProseLayout from '@/components/ProseLayout.vue'
import ReviewTodo from '@/components/ReviewTodo.vue'

// The frame of the Wiki: dated note, review marker, then the shared prose layout.
defineProps<{ items: { id: string; label: string }[] }>()
const { t } = useI18n()
</script>

<template>
  <ArchiveNotice class="mt-5">
    <p class="m-0">{{ t('wiki.note') }}</p>
    <p class="m-0"><ReviewTodo id="wiki-review" note="a medical reviewer must read every section before launch (text ported from the 2020 site, O-5a)" /></p>
  </ArchiveNotice>
  <ProseLayout class="mt-8" :items="items">
    <slot />
    <p class="mt-8 text-sm text-ink-muted">{{ t('wiki.source') }} <a href="https://pikobar.jabarprov.go.id" rel="noopener">pikobar.jabarprov.go.id</a></p>
  </ProseLayout>
</template>

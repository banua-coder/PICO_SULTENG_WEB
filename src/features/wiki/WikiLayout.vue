<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ArchiveNotice from '@/components/ArchiveNotice.vue'
import ReviewTodo from '@/components/ReviewTodo.vue'
import TableOfContents from '@/components/TableOfContents.vue'

// The frame of the Wiki: dated note, review marker, a table of contents (sticky side column on wide screens) and the article.
defineProps<{ items: { id: string; label: string }[] }>()
const { t } = useI18n()
</script>

<template>
  <ArchiveNotice class="mt-5">
    <p class="m-0">{{ t('wiki.note') }}</p>
    <p class="m-0"><ReviewTodo id="wiki-review" note="a medical reviewer must read every section before launch (text ported from the 2020 site, O-5a)" /></p>
  </ArchiveNotice>
  <div class="mt-8 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
    <div class="lg:sticky lg:top-6 lg:self-start"><TableOfContents :items="items" /></div>
    <article class="max-w-prose [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:scroll-mt-6 [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:pl-5">
      <slot />
      <p class="mt-10 text-sm text-ink-muted">{{ t('wiki.source') }} <a href="https://pikobar.jabarprov.go.id" rel="noopener">pikobar.jabarprov.go.id</a></p>
    </article>
  </div>
</template>

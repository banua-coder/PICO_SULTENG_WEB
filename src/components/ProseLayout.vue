<script setup lang="ts">
import TableOfContents from './TableOfContents.vue'

// Long text pages (Wiki, Metodologi): a table of contents (sticky side column on wide screens) and a 65ch article.
defineProps<{ items: { id: string; label: string }[] }>()
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
    <div class="lg:sticky lg:top-6 lg:self-start"><TableOfContents :items="items" /></div>
    <article class="max-w-prose [&_dd]:mt-1 [&_dt]:mt-4 [&_dt]:font-strong [&_h2]:mt-8 [&_h2]:scroll-mt-6 [&_h2]:text-xl [&_h3]:mt-6 [&_h3]:text-lg [&_li]:mt-3 [&_p]:mt-4 [&_ul]:mt-3 [&_ul]:pl-5">
      <slot />
    </article>
  </div>
</template>

<script setup lang="ts">
// A brand v2 illustration (public/illustrations, flat light and dark). Two plain images, the one of the current theme is shown (CSS in
// base.css), so the picture follows the theme switch and the system setting. Decorative by default: the text next to it carries the meaning.
withDefaults(defineProps<{ name: string; alt?: string; width?: number; loading?: 'lazy' | 'eager' }>(), { alt: '', width: 160, loading: 'lazy' })
</script>

<template>
  <span class="pico-ill inline-block" :style="{ width: `${width}px`, maxWidth: '100%' }" :role="alt ? 'img' : undefined" :aria-label="alt || undefined" :aria-hidden="alt ? undefined : 'true'">
    <img :src="`/illustrations/light/${name}.svg`" alt="" width="320" height="240" :loading="loading" decoding="async" class="pico-ill-light h-auto w-full">
    <img :src="`/illustrations/dark/${name}.svg`" alt="" width="320" height="240" :loading="loading" decoding="async" class="pico-ill-dark h-auto w-full">
  </span>
</template>

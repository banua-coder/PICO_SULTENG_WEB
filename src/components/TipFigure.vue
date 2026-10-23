<script setup lang="ts">
import { computed, useId } from 'vue'
import { inlineSvg } from './inlineSvg'

// A brand illustration with a visible caption. The picture is decoration; the caption carries the meaning.
const props = defineProps<{ svg: string; caption: string }>()
const uid = `tip${useId().replace(/\W/g, '')}`
const html = computed(() => inlineSvg(props.svg, uid))
</script>

<template>
  <figure class="m-0 flex flex-col gap-2">
    <!-- eslint-disable-next-line vue/no-v-html -- trusted brand illustration -->
    <div class="w-full [&>svg]:block [&>svg]:h-auto [&>svg]:w-full" style="aspect-ratio: 4 / 3" v-html="html" />
    <figcaption class="text-sm text-ink-muted">{{ caption }}</figcaption>
  </figure>
</template>

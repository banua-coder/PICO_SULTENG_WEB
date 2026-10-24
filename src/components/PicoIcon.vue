<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IconKey } from '@/assets/brand/icon-keys'
import { iconLabel, iconShapes } from './icons'

const props = withDefaults(
  defineProps<{
    name: IconKey
    /** Next to visible text: hidden from assistive tech. Standalone: set false to expose the localized label. */
    decorative?: boolean
    size?: 16 | 20 | 24
    variant?: 'mono' | 'duotone'
  }>(),
  { decorative: true, size: 24, variant: 'mono' },
)

const { locale } = useI18n()
const shapes = computed(() => iconShapes(props.name, props.variant))
const label = computed(() => iconLabel(props.name, locale.value === 'en' ? 'en' : 'id'))
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- trusted brand SVG shapes from src/assets/brand -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    focusable="false"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : label"
    v-html="shapes"
  />
</template>

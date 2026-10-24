<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// A visible marker for a claim or number that nobody has reviewed yet (open item O-5, spec README).
// `pnpm check:dist` fails when any data-todo is in the built site, unless PICO_ALLOW_TODO=1 (branch builds). Release builds do not set it.
defineProps<{ id: string; note: string }>()
const { t } = useI18n()
</script>

<template>
  <span :data-todo="id" class="inline-block rounded-sm border border-dashed border-line-strong bg-tint px-1 py-0.5 text-xs font-strong text-ink">{{ t('todo.label') }}: {{ note }}</span>
</template>

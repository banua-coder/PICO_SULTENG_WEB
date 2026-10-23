<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LottiePlayer from './LottiePlayer.vue'

export type StatusKind = 'loading' | 'empty' | 'error' | 'offline' | 'not-found'

const props = defineProps<{ kind: StatusKind; title?: string; compact?: boolean; /** element for the title: 'h1' on a page of its own */ heading?: 'p' | 'h1' | 'h2' }>()
const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()

// The illustrations are 4 to 8 KB each: load only the one a visitor needs, after the shell.
const loaders = import.meta.glob<string>('@/assets/brand/illustrations/pico-state-*.svg', { query: '?raw', import: 'default' })
const art = ref('')
async function loadArt() {
  art.value = ''
  if (props.kind === 'loading') return
  const hit = Object.entries(loaders).find(([p]) => p.endsWith(`pico-state-${props.kind}.svg`))
  if (hit) art.value = await hit[1]()
}
watch(() => props.kind, loadArt, { immediate: true })

const shownTitle = computed(() => props.title ?? t(`status.${props.kind === 'not-found' ? 'notFound' : props.kind}`))
const retryable = computed(() => props.kind === 'error' || props.kind === 'offline')
</script>

<template>
  <div
    class="mx-auto flex flex-col items-center gap-5 p-6 text-center"
    :class="compact ? 'max-w-xs' : 'max-w-md'"
    :role="kind === 'loading' ? 'status' : kind === 'error' || kind === 'offline' ? 'alert' : undefined"
    :data-kind="kind"
  >
    <LottiePlayer v-if="kind === 'loading'" name="loading" :label="shownTitle" />
    <!-- eslint-disable-next-line vue/no-v-html -- trusted brand illustration, inlined so it follows the theme -->
    <div v-else class="w-full [&>svg]:block [&>svg]:size-full" :style="{ aspectRatio: '4 / 3', maxWidth: compact ? '10rem' : '16rem' }" aria-hidden="true" v-html="art" />
    <component :is="props.heading ?? 'p'" class="font-display text-lg font-heading text-indigo">{{ shownTitle }}</component>
    <div class="flex flex-wrap items-center justify-center gap-3">
      <button
        v-if="retryable"
        type="button"
        class="min-h-touch min-w-touch rounded-sm bg-primary-strong px-5 text-on-primary"
        @click="emit('retry')"
      >
        {{ t('common.retry') }}
      </button>
      <slot name="actions" />
    </div>
  </div>
</template>

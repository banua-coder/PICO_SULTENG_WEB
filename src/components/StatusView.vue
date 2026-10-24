<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileQuestion, Inbox, TriangleAlert, WifiOff } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Illustration from './Illustration.vue'

export type StatusKind = 'loading' | 'empty' | 'error' | 'offline' | 'not-found'

const props = defineProps<{ kind: StatusKind; title?: string; compact?: boolean; /** element for the title: 'h1' on a page of its own */ heading?: 'p' | 'h1' | 'h2' }>()
const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()
const ICON = { empty: Inbox, error: TriangleAlert, offline: WifiOff, 'not-found': FileQuestion } as const
const shownTitle = computed(() => props.title ?? t(`status.${props.kind === 'not-found' ? 'notFound' : props.kind}`))
// the page-size states carry a brand v2 illustration; the compact ones (inside a card) keep the small icon
const ART: Partial<Record<StatusKind, string>> = { empty: 'state-kosong', error: 'state-galat', offline: 'state-luring', 'not-found': 'state-kosong' }
const retryable = computed(() => props.kind === 'error' || props.kind === 'offline')
</script>

<template>
  <div
    class="mx-auto flex flex-col items-center gap-3 p-4 text-center"
    :class="compact ? 'max-w-xs' : 'max-w-md'"
    :role="kind === 'loading' ? 'status' : kind === 'error' || kind === 'offline' ? 'alert' : undefined"
    :data-kind="kind"
  >
    <div v-if="kind === 'loading'" class="flex w-full flex-col items-center gap-3" aria-hidden="true">
      <Skeleton class="h-6 w-2/3" /><Skeleton class="h-24 w-full" />
    </div>
    <Illustration v-else-if="!compact && ART[kind]" :name="ART[kind]!" :width="200" />
    <component :is="ICON[kind]" v-else class="size-12 text-ink-muted" aria-hidden="true" />
    <component :is="props.heading ?? 'p'" class="m-0 font-display text-lg font-heading text-ink" :class="kind === 'loading' ? 'sr-only' : ''">{{ shownTitle }}</component>
    <div class="flex flex-wrap items-center justify-center gap-3">
      <Button v-if="retryable" type="button" @click="emit('retry')">{{ t('common.retry') }}</Button>
      <slot name="actions" />
    </div>
  </div>
</template>

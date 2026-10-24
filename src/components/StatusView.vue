<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Illustration from './Illustration.vue'
// the player wrapper is its own chunk: only a loading state needs it
const LottieMoment = defineAsyncComponent(() => import('./LottieMoment.vue'))

export type StatusKind = 'loading' | 'empty' | 'error' | 'offline' | 'not-found' | 'period-empty'

const props = defineProps<{ kind: StatusKind; title?: string; compact?: boolean; /** element for the title: 'h1' on a page of its own */ heading?: 'p' | 'h1' | 'h2' }>()
const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()
const shownTitle = computed(() => props.title ?? t(`status.${props.kind === 'not-found' ? 'notFound' : props.kind === 'period-empty' ? 'periodEmpty' : props.kind}`))
// every state carries a brand v2 picture: page-size at 200 px, inside a card or chart at 96 px. Loading plays the Lottie (poster first).
const ART: Record<Exclude<StatusKind, 'loading'>, string> = { empty: 'state-kosong', error: 'state-galat', offline: 'state-luring', 'not-found': 'state-kosong', 'period-empty': 'state-periode-kosong' }
const size = computed(() => (props.compact ? 96 : 200))
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
      <LottieMoment name="loading" :width="size" />
      <Skeleton class="h-6 w-2/3" /><Skeleton v-if="compact" class="h-16 w-full" />
    </div>
    <Illustration v-else :name="ART[kind]" :width="size" />
    <component :is="props.heading ?? 'p'" class="m-0 font-display text-lg font-heading text-ink" :class="kind === 'loading' ? 'sr-only' : ''">{{ shownTitle }}</component>
    <div class="flex flex-wrap items-center justify-center gap-3">
      <Button v-if="retryable" type="button" @click="emit('retry')">{{ t('common.retry') }}</Button>
      <slot name="actions" />
    </div>
  </div>
</template>

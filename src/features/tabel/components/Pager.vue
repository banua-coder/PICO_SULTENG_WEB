<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { pageNumbers } from '../paging'

const props = defineProps<{ page: number; pages: number; min: IsoDate; max: IsoDate }>()
const emit = defineEmits<{ 'update:page': [number]; jump: [IsoDate] }>()
const { t } = useI18n()
const date = ref('')
const numbers = computed(() => pageNumbers(props.page, props.pages))
const btn = 'min-h-touch min-w-touch rounded-sm border px-4 text-sm font-strong disabled:opacity-50'
const idle = 'border-line-strong bg-surface text-ink'
</script>

<template>
  <nav :aria-label="t('tabel.pager')" class="flex flex-wrap items-end gap-5">
    <div class="flex flex-wrap items-center gap-3">
      <button type="button" :class="[btn, idle]" :disabled="page <= 1" @click="emit('update:page', page - 1)">{{ t('tabel.prev') }}</button>
      <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
        <li v-for="(n, i) in numbers" :key="n ?? `gap${i}`">
          <span v-if="n === null" aria-hidden="true" class="px-1">…</span>
          <button v-else type="button" :class="[btn, n === page ? 'border-indigo bg-indigo text-on-indigo' : idle]" :aria-current="n === page ? 'page' : undefined" :aria-label="t('tabel.pageN', { n })" @click="emit('update:page', n)">{{ n }}</button>
        </li>
      </ul>
      <button type="button" :class="[btn, idle]" :disabled="page >= pages" @click="emit('update:page', page + 1)">{{ t('tabel.next') }}</button>
    </div>
    <p role="status" aria-live="polite" class="m-0 text-sm text-ink-muted">{{ t('tabel.pageOf', { page, pages }) }}</p>
    <form class="flex items-end gap-3" @submit.prevent="date && emit('jump', date)">
      <div class="flex flex-col gap-2">
        <label for="tabel-jump" class="text-sm text-ink-muted">{{ t('tabel.jump') }}</label>
        <input id="tabel-jump" v-model="date" type="date" :min="min" :max="max" class="min-h-touch rounded-sm border border-line-strong bg-surface px-3 text-ink">
      </div>
      <button type="submit" :class="[btn, idle]" :disabled="!date">{{ t('tabel.jumpGo') }}</button>
    </form>
  </nav>
</template>

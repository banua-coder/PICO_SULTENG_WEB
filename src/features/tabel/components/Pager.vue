<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IsoDate } from '@/api/types'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { pageNumbers } from '../paging'

const props = defineProps<{ page: number; pages: number; min: IsoDate; max: IsoDate }>()
const emit = defineEmits<{ 'update:page': [number]; jump: [IsoDate] }>()
const { t } = useI18n()
const date = ref('')
const numbers = computed(() => pageNumbers(props.page, props.pages))
</script>

<template>
  <nav :aria-label="t('tabel.pager')" class="flex flex-wrap items-end gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" :disabled="page <= 1" @click="emit('update:page', page - 1)"><ChevronLeft aria-hidden="true" />{{ t('tabel.prev') }}</Button>
      <ul class="m-0 flex list-none flex-wrap gap-1 p-0">
        <li v-for="(n, i) in numbers" :key="n ?? `gap${i}`">
          <span v-if="n === null" aria-hidden="true" class="px-0.5">…</span>
          <Button v-else type="button" :variant="n === page ? 'default' : 'outline'" size="icon" :aria-current="n === page ? 'page' : undefined" :aria-label="t('tabel.pageN', { n })" @click="emit('update:page', n)">{{ n }}</Button>
        </li>
      </ul>
      <Button type="button" variant="outline" :disabled="page >= pages" @click="emit('update:page', page + 1)">{{ t('tabel.next') }}<ChevronRight aria-hidden="true" /></Button>
    </div>
    <p role="status" aria-live="polite" class="m-0 text-sm text-ink-muted">{{ t('tabel.pageOf', { page, pages }) }}</p>
    <form class="flex flex-wrap items-end gap-2" @submit.prevent="date && emit('jump', date)">
      <div class="flex flex-col gap-1">
        <Label for="tabel-jump" class="text-sm text-ink-muted">{{ t('tabel.jump') }}</Label>
        <Input id="tabel-jump" v-model="date" type="date" :min="min" :max="max" />
      </div>
      <Button type="submit" variant="outline" :disabled="!date">{{ t('tabel.jumpGo') }}</Button>
    </form>
  </nav>
</template>

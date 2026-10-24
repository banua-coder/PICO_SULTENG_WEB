<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Hospital } from '@/api/types'
import { useFormat } from '@/app/useFormat'

defineProps<{ hospital: Hospital }>()
const { t } = useI18n()
const f = useFormat()
</script>

<template>
  <div class="max-w-full overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <caption class="pb-2 text-left font-strong">{{ t('kontak.bedsCaption', { hospital: hospital.name }) }}</caption>
      <thead>
        <tr class="bg-tint">
          <th scope="col" class="px-3 py-2 text-left">{{ t('kontak.bedType') }}</th>
          <th scope="col" class="px-3 py-2 text-right">{{ t('kontak.bedAvailable') }}</th>
          <th scope="col" class="px-3 py-2 text-right">{{ t('kontak.bedTotal') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in hospital.beds" :key="b.type" class="border-t border-line">
          <th scope="row" class="px-3 py-2 text-left font-normal">{{ b.type }}</th>
          <td class="px-3 py-2 text-right tabular-nums">{{ f.num(b.available) }}</td>
          <td class="px-3 py-2 text-right tabular-nums">{{ f.num(b.total) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

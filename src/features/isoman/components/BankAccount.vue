<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Donation } from '@/api/types'
import CopyButton from '@/components/CopyButton.vue'
import PicoImage from '@/components/PicoImage.vue'

defineProps<{ account: Donation['accounts'][number] }>()
const { t } = useI18n()
const digits = (n: string) => n.replace(/\D/g, '')
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- a logo only when the API has one; the bank name is always text -->
    <div v-if="account.logo" class="w-[3rem] flex-none"><PicoImage :src="account.logo" alt="" ratio="1/1" fallback="initials" /></div>
    <div class="min-w-0 flex-1">
      <p class="m-0 font-strong">{{ account.bank }}</p>
      <p class="m-0 tabular-nums" :aria-label="`${t('isoman.number')} ${account.number}`">{{ account.number }}</p>
      <p class="m-0 text-sm text-ink-muted">{{ t('isoman.holder', { name: account.holder }) }}</p>
    </div>
    <CopyButton :value="digits(account.number)" :label="t('isoman.copyWhat', { bank: account.bankShort || account.bank })" :done-text="t('copy.doneAccount')" />
  </div>
</template>

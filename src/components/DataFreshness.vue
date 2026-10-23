<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isLiveMode } from '@/api/config'
import { useFormat } from '@/app/useFormat'
import type { IsoDate } from '@/api/types'

defineProps<{ asOf: IsoDate; source: string }>()

const { t } = useI18n()
const fmt = useFormat()
const archive = !isLiveMode()
</script>

<template>
  <p class="text-sm text-ink-muted">
    {{ t('freshness.asOf', { date: fmt.date(asOf), source }) }}<template v-if="archive"> · {{ t('freshness.archive') }}</template>
  </p>
</template>

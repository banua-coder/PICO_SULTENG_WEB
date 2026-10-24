<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Contact } from '@/api/types'

const props = defineProps<{ contact: Contact }>()
const { t } = useI18n()

const kind = computed(() => t(`contact.${props.contact.kind}`))
// chat and social links leave the site: new tab, no opener
const newTab = computed(() => ['whatsapp', 'telegram', 'line', 'twitter', 'instagram'].includes(props.contact.kind) && props.contact.href !== '')
</script>

<template>
  <span class="inline-flex min-h-touch flex-wrap items-center gap-x-3">
    <span class="text-sm text-ink-muted">{{ kind }}</span>
    <a v-if="contact.href" :href="contact.href" :target="newTab ? '_blank' : undefined" :rel="newTab ? 'noopener noreferrer' : undefined">
      {{ contact.label }}<span v-if="newTab" class="sr-only"> {{ t('contact.newTab') }}</span>
    </a>
    <span v-else class="num">{{ contact.label }}</span>
  </span>
</template>

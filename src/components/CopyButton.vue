<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ value: string; /** what is copied, e.g. "nomor rekening" */ label: string }>()
const emit = defineEmits<{ copied: [] }>()

const { t } = useI18n()
const announced = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value)
  } catch {
    return // no clipboard access (insecure origin or denied): say nothing rather than claim success
  }
  announced.value = t('copy.done')
  emit('copied')
  clearTimeout(timer)
  timer = setTimeout(() => (announced.value = ''), 2000)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span class="inline-flex items-center gap-3">
    <button
      type="button"
      class="min-h-touch min-w-touch rounded-sm border border-line-strong bg-surface px-4 text-sm font-strong text-primary-strong"
      :aria-label="t('copy.action', { what: label })"
      @click="copy"
    >
      {{ announced || t('copy.short') }}
    </button>
    <span role="status" aria-live="polite" class="sr-only">{{ announced }}</span>
  </span>
</template>

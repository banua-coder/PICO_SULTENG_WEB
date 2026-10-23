<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    src: string | null
    alt: string
    ratio: '16/9' | '4/5' | '1/1'
    fallback?: 'plate' | 'initials'
    loading?: 'lazy' | 'eager'
  }>(),
  { fallback: 'plate', loading: 'lazy' },
)

const { t } = useI18n()
const failed = ref(false)
const img = ref<HTMLImageElement>()
const shown = computed(() => !!props.src && !failed.value)
const initials = computed(() =>
  props.alt
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => [...w][0]!.toUpperCase())
    .join(''),
)

watch(() => props.src, () => (failed.value = false))
// the error event can fire before hydration attaches the listener, so check once after mount
onMounted(() => {
  const el = img.value
  if (el && el.complete && el.naturalWidth === 0) failed.value = true
})
</script>

<template>
  <!-- The box has its own fixed ratio, so a missing image never shifts the layout (CLS 0). -->
  <div class="relative w-full overflow-hidden rounded-md bg-tint" :style="{ aspectRatio: ratio }">
    <img
      v-if="shown"
      ref="img"
      :src="src!"
      :alt="alt"
      :loading="loading"
      decoding="async"
      referrerpolicy="no-referrer"
      class="absolute inset-0 size-full object-cover"
      @error="failed = true"
    >
    <div v-else-if="fallback === 'initials' && initials" role="img" :aria-label="alt" class="absolute inset-0 flex items-center justify-center" data-placeholder="initials">
      <span aria-hidden="true" class="flex size-8 items-center justify-center rounded-full border-2 border-line-strong bg-surface font-display text-lg font-heading text-indigo">{{ initials }}</span>
    </div>
    <div v-else role="img" :aria-label="`${alt}. ${t('image.missing')}`" class="absolute inset-0 flex items-center justify-center" data-placeholder="plate">
      <svg viewBox="0 0 120 120" class="h-2/3 max-h-full" aria-hidden="true" focusable="false">
        <circle cx="60" cy="60" r="46" :style="{ fill: 'var(--pico-surface)', stroke: 'var(--pico-line-strong)' }" stroke-width="3" />
        <g :style="{ stroke: 'var(--pico-line)' }" stroke-width="1.5">
          <path v-for="x in [36, 48, 60, 72, 84]" :key="`w${x}`" :d="`M${x} 24V96`" />
          <path v-for="y in [36, 48, 60, 72, 84]" :key="`f${y}`" :d="`M24 ${y}H96`" />
        </g>
        <circle cx="60" cy="60" r="7" :style="{ fill: 'var(--pico-crimson)' }" />
      </svg>
    </div>
  </div>
</template>

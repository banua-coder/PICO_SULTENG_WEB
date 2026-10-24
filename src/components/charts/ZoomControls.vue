<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from '@lucide/vue'
import type { IsoDate } from '@/api/types'
import { useFormat } from '@/app/useFormat'
import { Button } from '@/components/ui/button'
import type { Zoom } from './core/useZoom'

// Buttons and a slider for the zoom of a time chart (the legacy "Reset Zoom" and more). All of them call the same actions as the keys.
const props = defineProps<{ zoom: Zoom; range?: [IsoDate, IsoDate] }>()
const { t } = useI18n()
const fmt = useFormat()
const id = useId()
const text = computed(() => (props.zoom.zoomed.value && props.range ? t('chart.zoomShowing', { from: fmt.date(props.range[0]), to: fmt.date(props.range[1]) }) : t('chart.zoomAll')))
</script>

<template>
  <div class="mt-3 flex flex-wrap items-center gap-2" role="toolbar" :aria-label="t('chart.zoomGroup')" data-testid="zoom-controls">
    <Button type="button" variant="outline" size="sm" class="min-h-touch min-w-touch" :disabled="!zoom.canIn.value" :aria-label="t('chart.zoomIn')" @click="zoom.zoomIn()"><Plus aria-hidden="true" /></Button>
    <Button type="button" variant="outline" size="sm" class="min-h-touch min-w-touch" :disabled="!zoom.canOut.value" :aria-label="t('chart.zoomOut')" @click="zoom.zoomOut()"><Minus aria-hidden="true" /></Button>
    <Button type="button" variant="outline" size="sm" class="min-h-touch min-w-touch" :disabled="!zoom.zoomed.value" :aria-label="t('chart.panLeft')" @click="zoom.pan(-0.25 * zoom.span.value)"><ChevronLeft aria-hidden="true" /></Button>
    <Button type="button" variant="outline" size="sm" class="min-h-touch min-w-touch" :disabled="!zoom.zoomed.value" :aria-label="t('chart.panRight')" @click="zoom.pan(0.25 * zoom.span.value)"><ChevronRight aria-hidden="true" /></Button>
    <Button type="button" variant="outline" size="sm" class="min-h-touch text-primary-strong" :disabled="!zoom.zoomed.value" data-testid="zoom-reset" @click="zoom.reset()"><RotateCcw aria-hidden="true" />{{ t('chart.zoomReset') }}</Button>
    <label v-if="zoom.zoomed.value" :for="id" class="sr-only">{{ t('chart.zoomSlider') }}</label>
    <input v-if="zoom.zoomed.value" :id="id" type="range" class="min-h-touch min-w-40 flex-1 accent-[var(--pico-primary)]" min="0" :max="zoom.maxOffset.value" step="1" :value="zoom.offset.value" @input="zoom.setOffset(+($event.target as HTMLInputElement).value)">
    <p role="status" aria-live="polite" class="m-0 w-full text-sm text-ink-muted" data-testid="zoom-status">{{ text }}</p>
  </div>
</template>

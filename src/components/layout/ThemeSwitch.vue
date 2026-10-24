<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Moon, Sun, SunMoon } from '@lucide/vue'
import { useTheme } from '@/app/useTheme'
import { Button } from '@/components/ui/button'

// system -> light -> dark. The name says the current choice; the icon repeats it.
const { t } = useI18n()
const { theme, cycle } = useTheme()
</script>

<template>
  <Button variant="outline" size="icon" :title="t('theme.hint')" @click="cycle">
    <SunMoon v-if="theme === 'system'" aria-hidden="true" />
    <Sun v-else-if="theme === 'light'" aria-hidden="true" />
    <Moon v-else aria-hidden="true" />
    <span class="sr-only">{{ t('theme.label') }}: {{ t(`theme.${theme}`) }}</span>
  </Button>
</template>

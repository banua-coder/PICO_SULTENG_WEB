<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Moon, Sun, SunMoon } from '@lucide/vue'
import { useTheme } from '@/app/useTheme'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// system -> light -> dark. The name says the current choice; the icon repeats it.
const { t } = useI18n()
const { theme, cycle } = useTheme()
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="outline" size="icon" class="" @click="cycle">
          <SunMoon v-if="theme === 'system'" aria-hidden="true" />
          <Sun v-else-if="theme === 'light'" aria-hidden="true" />
          <Moon v-else aria-hidden="true" />
          <span class="sr-only">{{ t('theme.label') }}: {{ t(`theme.${theme}`) }}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{{ t('theme.hint') }}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

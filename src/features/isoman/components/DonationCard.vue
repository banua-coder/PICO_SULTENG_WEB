<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Donation } from '@/api/types'
import ContactLink from '@/components/ContactLink.vue'
import PicoImage from '@/components/PicoImage.vue'
import BankAccount from './BankAccount.vue'

defineProps<{ donation: Donation }>()
const { t } = useI18n()
const id = useId()
</script>

<template>
  <article :aria-labelledby="id" class="flex flex-col gap-4 rounded-md border border-line bg-surface p-5">
    <PicoImage :src="donation.image" :alt="donation.title" ratio="16/9" fallback="initials" />
    <h3 :id="id" class="text-lg">{{ donation.title }}</h3>
    <p class="m-0 text-sm text-ink-muted">
      {{ t('isoman.initiator') }}:
      <a v-if="donation.href" :href="donation.href" target="_blank" rel="noopener noreferrer">{{ donation.initiator }}<span class="sr-only"> {{ t('contact.newTab') }}</span></a>
      <template v-else>{{ donation.initiator }}</template>
    </p>
    <p v-if="donation.description" class="m-0">{{ donation.description }}</p>
    <p v-if="donation.acceptsGoods" class="m-0 font-strong">{{ t('isoman.acceptsGoods') }}</p>
    <p v-if="donation.acceptsGoods && donation.deliveryAddress" class="m-0 text-sm"><span class="font-strong">{{ t('isoman.deliveryAddress') }}:</span> {{ donation.deliveryAddress }}</p>
    <ul v-if="donation.contacts.length" class="m-0 flex list-none flex-col p-0">
      <li v-for="(c, i) in donation.contacts" :key="i"><ContactLink :contact="c" /></li>
    </ul>
    <div v-if="donation.accounts.length">
      <h4 class="text-md">{{ t('isoman.accounts') }}</h4>
      <ul class="m-0 mt-2 flex list-none flex-col gap-4 p-0">
        <li v-for="(a, i) in donation.accounts" :key="i"><BankAccount :account="a" /></li>
      </ul>
    </div>
  </article>
</template>

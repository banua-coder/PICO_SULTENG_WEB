<script setup lang="ts">
import PicoIcon from '@/components/PicoIcon.vue'
import ReviewTodo from '@/components/ReviewTodo.vue'

// English guide (spec 73). Same sections as the Indonesian guide.
</script>

<template>
  <div class="flex max-w-prose flex-col gap-8 [&_h2]:text-xl [&_li]:mt-3 [&_ol]:mt-4 [&_ol]:pl-5 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:pl-5">
    <section aria-labelledby="tanda-bahaya" class="rounded-md border-2 border-indigo bg-tint p-5">
      <h2 id="tanda-bahaya" class="flex items-center gap-3"><PicoIcon name="info" :size="24" class="flex-none text-indigo" /> Danger signs: go to a health facility now</h2>
      <ul>
        <li>Shortness of breath, or breathing that feels heavy.</li>
        <li>Fast breathing, more than 20 breaths per minute.</li>
        <li>Blood oxygen saturation below 95%, if you have an oximeter.</li>
        <li>Symptoms getting worse.</li>
      </ul>
      <p class="font-strong">Contact the nearest health facility right away if you see these signs.</p>
      <p><ReviewTodo id="isoman-danger-signs" note="the limits come from the 2021 Ministry of Health table on the old page; a medical reviewer must confirm them before launch (O-5a)" /></p>
    </section>

    <section aria-labelledby="langkah-pertama">
      <h2 id="langkah-pertama">First steps</h2>
      <p>If you tested positive, report to your nearest community health centre or health facility so that your health can be followed. The report also helps trace close contacts.</p>
      <p>Talk to a doctor before you decide to isolate at home. The doctor decides whether you can isolate at home, in an isolation facility, or need hospital care.</p>
    </section>

    <section aria-labelledby="persiapan">
      <h2 id="persiapan">What to prepare</h2>
      <ol class="list-decimal">
        <li>Stay at home, except for medical needs.</li>
        <li>Keep a doctor's contact number for advice and follow-up.</li>
        <li>Have health tools such as a thermometer and an oximeter, and others that fit any other illness you have, for example a blood pressure monitor.</li>
        <li>Tell your family, community and friends that you are isolating at home.</li>
        <li>Use a separate bedroom, and a separate bathroom if you can.</li>
        <li>Pack a bag with what you need if you suddenly must go to a health facility: ID card, BPJS card, treatment card, a change of clothes.</li>
      </ol>
    </section>

    <section aria-labelledby="perawatan-harian">
      <h2 id="perawatan-harian">Daily care</h2>
      <ul class="list-disc">
        <li>Take your temperature every day and watch for symptoms such as cough or trouble breathing.</li>
        <li>Wear a mask, wash your hands and keep your distance from people in the house.</li>
        <li>Do not share dishes, bathing items and bed linen.</li>
        <li>Eat nutritious food, wash your hands with soap and running water, and cover your mouth when you cough or sneeze.</li>
      </ul>
    </section>

    <p class="m-0 text-sm text-ink-muted">Original material: Ministry of Health of Indonesia and KawalCovid19, 2021. Rearranged by PICO Sulteng. <ReviewTodo id="isoman-review" note="a medical reviewer must read this whole guide before launch (O-5a)" /></p>
  </div>
</template>

<script setup lang="ts">
import PicoIcon from '@/components/PicoIcon.vue'

// English guide (spec 73). Same sections as the Indonesian guide.
</script>

<template>
  <div class="flex max-w-prose flex-col gap-8 [&_h2]:text-xl [&_li]:mt-3 [&_ol]:mt-4 [&_ol]:pl-5 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:pl-5">
    <section aria-labelledby="tanda-bahaya" class="rounded-md border-2 border-indigo bg-tint p-5">
      <h2 id="tanda-bahaya" class="flex items-center gap-3"><PicoIcon name="info" :size="24" class="flex-none text-indigo" /> Danger signs: go to a health facility now</h2>
      <ul>
        <li>Shortness of breath or difficulty breathing.</li>
        <li>Chest pain.</li>
        <li>Confusion, or being unable to speak or move as usual.</li>
        <li>More than 20 breaths per minute. In mild illness, breathing is 12 to 20 breaths per minute.</li>
        <li>Blood oxygen saturation below 95%, if you have an oximeter. In mild illness, saturation is above 95%.</li>
        <li>Symptoms getting worse.</li>
      </ul>
      <p class="font-strong">Contact your community health centre, the nearest health facility or your monitoring health worker right away if you see these signs.</p>
      <p class="font-strong">Call 119 or go to the emergency department of a hospital now if you have severe shortness of breath, chest pain, confusion, more than 30 breaths per minute, or oxygen saturation below 93%. The Ministry of Health classes more than 30 breaths per minute or saturation below 93% as severe illness.</p>
      <p>This guide is for adults. For children, pregnant women, or if you have another illness, ask a health worker.</p>
    </section>

    <section aria-labelledby="langkah-pertama">
      <h2 id="langkah-pertama">First steps</h2>
      <p>If you have symptoms or tested positive, get advice right away through telemedicine or your local community health centre. Health workers do the monitoring.</p>
      <p>You can isolate at home or in a central isolation facility. Hospitals are kept first for patients with moderate, severe or critical illness, and those who need oxygen.</p>
    </section>

    <section aria-labelledby="persiapan">
      <h2 id="persiapan">What to prepare</h2>
      <ol class="list-decimal">
        <li>Have a thermometer and an oximeter.</li>
        <li>Keep the number of your monitoring health worker or community health centre, to report if you get worse.</li>
        <li>Use a separate bedroom if you can.</li>
        <li>Use your own dishes and bathing items.</li>
        <li>If you have another illness, keep taking your regular medicine as your doctor advises.</li>
      </ol>
    </section>

    <section aria-labelledby="perawatan-harian">
      <h2 id="perawatan-harian">Daily care</h2>
      <ul class="list-disc">
        <li>Measure and write down your temperature and oxygen saturation twice a day, morning and evening.</li>
        <li>Tell your monitoring health worker or community health centre if your temperature goes above 38&nbsp;°C.</li>
        <li>Wear a mask when you leave your room and when you meet family. Keep your distance and cover your mouth when you cough or sneeze.</li>
        <li>Wash your hands often with soap and running water, or with hand sanitiser.</li>
        <li>Wash dishes and cups right away with water and soap.</li>
        <li>Open the bedroom window now and then and clean the room every day.</li>
      </ul>
    </section>

    <p class="m-0 text-sm text-ink-muted">Rearranged by PICO Sulteng from these public sources, as of 24 October 2026. No medical professional has reviewed it, and it does not replace a doctor's advice. Sources: <a href="https://infeksiemerging.kemkes.go.id/document/download/mvE" rel="noopener">Minister of Health Decree HK.01.07/MENKES/5671/2021</a> (19 August 2021); <a href="https://kemkes.go.id/id/pasien-positif-covid-19-tanpa-gejala-cukup-isoman" rel="noopener">Ministry of Health, 4 February 2022</a>; <a href="https://www.who.int/news-room/questions-and-answers/item/coronavirus-disease-covid-19-home-care-for-families-and-caregivers" rel="noopener">WHO, home care</a> (12 April 2022); <a href="https://kemkes.go.id/id/akses-darurat-medis-119-kini-bisa-melalui-satusehat-mobile" rel="noopener">Ministry of Health, 119 medical emergency service</a> (5 October 2024).</p>
  </div>
</template>

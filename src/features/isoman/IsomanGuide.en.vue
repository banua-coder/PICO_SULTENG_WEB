<script setup lang="ts">
import PicoIcon from '@/components/PicoIcon.vue'
import IsomanCategories from './IsomanCategories.vue'
import IsomanCtas from './IsomanCtas.vue'
import type { Category } from './IsomanCategories.vue'
import type { Cta } from './IsomanCtas.vue'

// Home isolation guide in the order of the old page (Pages/Isolation/Index.vue): four cards, where to be treated, guide at home, close contacts, when free, repeat PCR. The danger-signs box on top is new.
const ctas: Cta[] = [
  { key: 'tele', href: '#telemedicine', title: 'Consult a doctor', label: 'Ask now', text: 'If you need medicine or advice, first talk to a doctor through a doctor teleconsultation service.', art: 'telekonsultasi' },
  { key: 'survey', title: 'Isolation patient registration', label: 'Fill in now', text: 'Registration of isolation patients and what they need, to help the volunteer team deliver basic supplies to people in home isolation.', art: 'isolasi-mandiri', inactive: 'This service is no longer active: the volunteer registration has ended and the old form is no longer used.' },
  { key: 'faq', href: 'https://bit.ly/faqisoman', title: 'Questions about home isolation', label: 'View', text: 'Questions and answers from doctors and health workers about home isolation and COVID-19, collected in 2021.', image: '/media/faq.webp', external: true },
  { key: 'donasi', href: '#donasi', title: 'Donations for isolation patients', label: 'Donate now', text: 'Donation drives started by kind people to help residents in home isolation.', art: 'bantuan-antar' },
]
const categories: Category[] = [
  { name: 'No symptoms', signs: ['Breathing rate: 12-20 breaths/minute', 'Saturation ≥ 95%'], places: ['Home isolation', 'Government isolation facility'] },
  { name: 'Mild', signs: ['Fever, cough, headache, nausea, loss of smell and taste', 'Breathing rate: 12-20 breaths/minute', 'Saturation ≥ 95%'], places: ['Government isolation facility', 'Home isolation for those who qualify'] },
  { name: 'Moderate', signs: ['Almost the same as mild symptoms', 'but with: Breathing rate: 20-30 breaths/minute', 'Saturation < 95%', 'Shortness of breath without respiratory distress'], places: ['Covid-19 emergency hospital', 'Non-referral hospital', 'Referral hospital'] },
  { name: 'Severe-Critical', signs: ['Almost the same as moderate symptoms', 'but with: Breathing rate: > 30 breaths/minute', 'Saturation < 95%', 'Shortness of breath with respiratory distress', 'Critical condition: respiratory failure, septic shock and multiorgan failure'], places: ['HCU/ICU of a referral hospital'] },
]
</script>

<template>
  <div class="flex flex-col gap-8 [&_li]:mt-2 [&_p]:mt-3">
    <section aria-labelledby="tanda-bahaya" class="rounded-md border-2 border-indigo bg-tint p-4">
      <h2 id="tanda-bahaya" class="flex items-center gap-2"><PicoIcon name="info" :size="24" class="flex-none text-indigo" /> Danger signs: go to a health facility now</h2>
      <ul class="list-disc pl-5">
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

    <section aria-labelledby="info-isoman">
      <h2 id="info-isoman" class="m-0 text-xl font-bold">Home isolation information</h2>
      <IsomanCtas class="mt-4" :items="ctas" />
    </section>

    <section aria-labelledby="perawatan" class="rounded-lg bg-card p-4 shadow-lg" data-testid="isoman-perawatan">
      <h2 id="perawatan" class="m-0 text-lg font-bold">Care for COVID-19 patients</h2>
      <p>As Covid-19 cases rose in Central Sulawesi, information on hospital bed occupancy <i>(Bed Occupancy Rate/BOR)</i> was needed to spread patient care, together with a guide to home isolation to help people who were isolating. Below is the advice on where to treat Covid-19 patients in Central Sulawesi, grouped by the symptoms the patient has.</p>
      <p class="text-center font-bold">Advised place of care for Covid-19 patients by symptoms</p>
      <IsomanCategories class="mt-4" :items="categories" signs-label="Signs" places-label="Where to be treated" />
      <p class="mt-2 text-right text-sm text-ink-muted">Source: Indonesian Ministry of Health</p>
    </section>

    <section aria-labelledby="rumah" class="rounded-lg bg-card p-4 shadow-lg" data-testid="isoman-rumah">
      <h2 id="rumah" class="m-0 text-lg font-bold">Guide to isolating at home</h2>
      <p>The first thing to do after a positive result is to <b>report to the nearest community health centre (puskesmas) or health facility</b> for health monitoring. Besides an early check by a health worker, the report is needed to trace close contacts.</p>
      <p>A patient with a positive Covid-19 test should not decide to self-isolate <b>without talking to a doctor</b>. The doctor decides whether the patient can isolate at home, in a central isolation facility, or needs hospital care. Seeing a doctor matters so the treatment fits the condition and a worsening during isolation is noticed early.</p>
      <p>If you are confirmed without symptoms or with mild symptoms, you need to isolate yourself. <b>What should you prepare for self-isolation?</b></p>
      <ol class="list-decimal pl-6">
        <li>Stay at home, except for medical needs.</li>
        <li>Besides medicine and vitamins, keep a doctor's contact number for advice and for monitoring your condition.</li>
        <li>Have health tools such as a thermometer, an oximeter and others suited to any other illness you have (for example a blood pressure monitor).</li>
        <li>Tell family, community and friends if you are diagnosed with Covid-19 and must isolate.</li>
        <li>Use a separate bedroom from other family members and, if possible, a separate bathroom.</li>
        <li>Follow health protocols (wear a mask, wash hands, keep your distance).</li>
        <li>Measure your temperature daily and watch for clinical signs such as cough or difficulty breathing.</li>
        <li>Do not share eating utensils, bathing items and linen or sheets.</li>
        <li>Air conditioning is not recommended.</li>
        <li>Follow clean and healthy living habits (PHBS): eat nutritious food, wash hands with soap and running water, and cover coughs and sneezes.</li>
        <li>Sit in the morning sunlight every day.</li>
        <li>Keep the house clean with disinfectant.</li>
        <li>Pack a bag with emergency needs in case you suddenly have to go to the nearest health facility: ID card, BPJS card, the card of your usual clinic or hospital, a change of clothes, and other things such as a phone.</li>
        <li>Contact the nearest health facility right away if symptoms get worse, for further care.</li>
      </ol>
      <p class="mt-2 text-right text-sm text-ink-muted">Source: Indonesian Ministry of Health &amp; KawalCovid19</p>
    </section>

    <section aria-labelledby="kontak-erat" class="rounded-lg bg-card p-4 shadow-lg" data-testid="isoman-kontak-erat">
      <h2 id="kontak-erat" class="m-0 text-lg font-bold">Close contacts of a COVID-19 patient</h2>
      <p>Everyone who had contact with a Covid-19 patient in the <b>48 hours before the Covid-19 test was taken</b> counts, including close contacts. Contact tracing means finding people who may have been exposed and checking close contacts every day for 14 days. Close contacts are advised to take a PCR test <b>at least 3 days after close contact with the patient, or at least 5 days after contact for an antigen swab test</b>.</p>
      <p>If the PCR or antigen result is negative, family members must still quarantine in a separate room for 14 days in case symptoms appear. <b>Quarantine for close contacts follows the same steps as home isolation for a patient, but no medicine is taken</b>.</p>
      <p class="mt-2 text-right text-sm text-ink-muted">Source: WHO &amp; KawalCovid19</p>
    </section>

    <section aria-labelledby="bebas" class="rounded-lg bg-card p-4 shadow-lg" data-testid="isoman-bebas">
      <h2 id="bebas" class="m-0 text-lg font-bold">When is a COVID-19 patient free from isolation?</h2>
      <p>Home isolation lasts <b>about 10 days</b> or until the patient meets the recovery criteria. A patient with mild or moderate symptoms isolates for 10 days plus 3 days after the symptoms are gone, and is free on day 14. If symptoms appear during isolation, the isolation time <b>is extended by another 10 days from the first day of symptoms</b>, not counted from the first positive test.</p>
      <p class="mt-2 text-right text-sm text-ink-muted">Source: Indonesian Ministry of Health &amp; KawalCovid19</p>
    </section>

    <section aria-labelledby="pcr-ulang" class="rounded-lg bg-card p-4 shadow-lg" data-testid="isoman-pcr-ulang">
      <h2 id="pcr-ulang" class="m-0 text-lg font-bold">After isolation, must you repeat the PCR test?</h2>
      <p>The Ministry of Health has said there is no requirement to repeat the PCR test for mild or moderate Covid-19 patients who <b>have finished isolation</b>.</p>
      <p>Patients do not need to rely on the CT value on the test result. The CT value is not the only measure of whether someone is free from isolation or needs another test. Only a doctor, who <b>has the authority and can confirm the patient's health status</b>, decides whether a repeat PCR test is needed.</p>
      <p>Isolating at home, with no symptoms or mild ones, can be hard for some people. But it is an effective way to protect you, your family and others from Covid-19.</p>
      <p class="mt-2 text-right text-sm text-ink-muted">Source: Indonesian Ministry of Health &amp; KawalCovid19</p>
    </section>

    <p class="m-0 text-sm text-ink-muted">The guidance below is copied from the old page (2021) and may have changed. No medical professional has reviewed it, and it does not replace a doctor's advice.</p>
  </div>
</template>

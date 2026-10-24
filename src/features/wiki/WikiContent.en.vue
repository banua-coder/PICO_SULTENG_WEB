<script setup lang="ts">
import { RouterLink } from 'vue-router'
import TipFigure from '@/components/TipFigure.vue'
import wash from '@/assets/images/wash_hands.png'
import mask from '@/assets/images/wear_mask.png'
import PicoIcon from '@/components/PicoIcon.vue'
import WikiLayout from './WikiLayout.vue'

// English text of the Wiki (spec 72). Same sections, anchors and sources as the Indonesian text.
const items = [
  { id: 'apa-itu', label: 'What COVID-19 is' },
  { id: 'penularan', label: 'How it spreads' },
  { id: 'gejala', label: 'Symptoms' },
  { id: 'pencegahan', label: 'How to prevent it' },
  { id: 'istilah', label: 'Key terms' },
  { id: 'jika-terinfeksi', label: 'If you are infected' },
  { id: 'mitos', label: 'Myths and facts' },
]
const myths: [string, string][] = [
  ['COVID-19 cannot spread in hot and humid places.', 'The virus can spread in hot and humid places.'],
  ['Cold weather and snow can kill the coronavirus.', 'Cold weather and snow cannot kill the coronavirus.'],
  ['Hand dryers can kill the coronavirus.', 'Hand dryers are not effective at killing the coronavirus. Wash your hands with soap and water, or use an alcohol-based hand rub.'],
  ['Spraying bleach or a disinfectant on the body can kill the coronavirus.', 'Never spray or put bleach or any disinfectant into your body. It is poisonous if swallowed and harms the skin and eyes.'],
]
</script>

<template>
  <WikiLayout :items="items">
    <section aria-labelledby="apa-itu">
      <h2 id="apa-itu">What COVID-19 is</h2>
      <p>COVID-19 is an infectious disease caused by the SARS-CoV-2 virus, a type of coronavirus.</p>
    </section>

    <section aria-labelledby="penularan">
      <h2 id="penularan">How it spreads</h2>
      <p>The virus leaves the mouth or nose of an infected person in small liquid particles. Other people can breathe them in. It spreads mainly between people who are near each other, and the risk is higher when they are close for a long time.</p>
      <p>People can also be infected if they touch their eyes, nose or mouth after touching a contaminated surface.</p>
      <ul>
        <li>Closed rooms with poor ventilation are riskier.</li>
        <li>People without symptoms can also pass the virus on, although how often this happens is not clear.</li>
      </ul>
    </section>

    <section aria-labelledby="gejala">
      <h2 id="gejala" class="flex items-center gap-2"><PicoIcon name="symptoms" :size="24" class="text-indigo" /> Symptoms</h2>
      <p>The most common symptoms are fever, cough, tiredness, and loss of taste or smell. Others include sore throat, headache, and aches and pains. A serious sign is difficulty breathing or shortness of breath. Some people are infected without any symptoms.</p>
      <p>If you have symptoms, read <a href="#jika-terinfeksi">If you are infected</a>.</p>
    </section>

    <section aria-labelledby="pencegahan">
      <h2 id="pencegahan">How to prevent it</h2>
      <p>COVID-19 vaccines protect against severe illness and death from COVID-19 (WHO). Ask your nearest community health centre or health facility whether the vaccine is available and whether you should have it.</p>
      <p>These steps also lower the risk of catching and passing on the virus:</p>
      <ol class="mt-2 pl-4">
        <li>Wash your hands with soap and water, or with an alcohol-based hand rub.</li>
        <li>Cover your nose and mouth when you cough or sneeze.</li>
        <li>Keep at least one metre away from others, even if they look well.</li>
        <li>Wear a well-fitting mask when you cannot keep your distance, or in a room with poor ventilation.</li>
        <li>Indoors, open the windows to let outside air in.</li>
      </ol>
      <div class="mt-4 grid grid-cols-2 gap-4">
        <TipFigure :src="wash" caption="Wash your hands with soap and water." />
        <TipFigure :src="mask" caption="Wear a mask when you cannot keep your distance." />
        <TipFigure icon="prevention.distancing" caption="Keep about one metre apart." />
        <TipFigure icon="vaccine" caption="Ask a health facility about vaccination." />
      </div>
    </section>

    <section aria-labelledby="istilah">
      <h2 id="istilah">Key terms</h2>
      <p>On 13 July 2020 the Minister of Health issued Decree No. HK.01.07/MENKES/413/2020. The Ministry of Health announced it on 14 July 2020. The terms ODP (person under monitoring), PDP (patient under supervision) and OTG (person without symptoms) were replaced by the terms below. The definitions follow that decree.</p>
      <dl class="mt-2 [&_dd]:mt-0.5 [&_dt]:mt-3 [&_dt]:font-strong">
        <dt>Suspect (suspek)</dt>
        <dd>A person with an acute respiratory infection who, in the 14 days before symptoms began, travelled to or lived in an area with local transmission, or had contact with a confirmed or probable case. A person with a severe respiratory infection or severe pneumonia that needs hospital care, with no other convincing cause, is also included.</dd>
        <dt>Probable</dt>
        <dd>A suspected case with severe respiratory infection, acute respiratory failure (ARDS) or death, with a clinical picture that strongly suggests COVID-19, and no RT-PCR laboratory result yet.</dd>
        <dt>Confirmed (konfirmasi)</dt>
        <dd>A person who tested positive for COVID-19 by RT-PCR laboratory test. Some have symptoms and some do not.</dd>
        <dt>Close contact (kontak erat)</dt>
        <dd>A person who has been in contact with a probable or confirmed COVID-19 case.</dd>
        <dt>Rt (effective reproduction number)</dt>
        <dd>The average number of people infected by one infected person at a given time. An Rt above 1 means spread is growing, below 1 means it is shrinking. How it is calculated is on the <RouterLink to="/en/metodologi#rt">Methodology</RouterLink> page.</dd>
      </dl>
    </section>

    <section aria-labelledby="jika-terinfeksi">
      <h2 id="jika-terinfeksi">If you are infected</h2>
      <p>If you have symptoms or tested positive, contact your nearest community health centre or health facility and follow the advice of health workers.</p>
      <p>The home isolation guide and the danger signs are on the <RouterLink to="/en/isoman">Home isolation</RouterLink> page.</p>
      <p>Since 1 March 2023 the PeduliLindungi app is SATUSEHAT Mobile.</p>
    </section>

    <section aria-labelledby="mitos">
      <h2 id="mitos">Myths and facts</h2>
      <p>Some myths that spread during the pandemic, and the WHO answers:</p>
      <ul class="list-none pl-0">
        <li v-for="[myth, fact] in myths" :key="myth" class="rounded-sm border border-line p-2">
          <p class="m-0"><strong>Myth:</strong> {{ myth }}</p>
          <p class="m-0"><strong>Fact:</strong> {{ fact }}</p>
        </li>
      </ul>
    </section>
    <p class="mt-12 text-sm text-ink-muted">This page follows these public sources, as of 24 October 2026, and no medical professional has reviewed it: <a href="https://www.who.int/news-room/questions-and-answers/item/coronavirus-disease-covid-19-how-is-it-transmitted" rel="noopener">WHO, how it spreads</a> (23 December 2021); <a href="https://www.who.int/health-topics/coronavirus" rel="noopener">WHO, symptoms and prevention</a>; <a href="https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters" rel="noopener">WHO, myths</a> (19 January 2022); <a href="https://www.who.int/news-room/questions-and-answers/item/coronavirus-disease-(covid-19)-vaccines" rel="noopener">WHO, COVID-19 vaccines</a>; <a href="https://kemkes.go.id/eng/%20kemenkes-kenalkan-istilah-probable-suspect-kontak-erat-dan-terkonfirmasi-covid-19" rel="noopener">Ministry of Health, case terms (14 July 2020)</a>; <a href="https://kemkes.go.id/id/besok-pedulilindungi-resmi-bertransformasi-menjadi-satusehat-mobile" rel="noopener">Ministry of Health, SATUSEHAT Mobile (28 February 2023)</a>.</p>
  </WikiLayout>
</template>

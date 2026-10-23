<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ReviewTodo from '@/components/ReviewTodo.vue'
import TipFigure from '@/components/TipFigure.vue'
import PicoIcon from '@/components/PicoIcon.vue'
import distance from '@/assets/brand/illustrations/pico-tip-keep-distance.svg?raw'
import vaccinated from '@/assets/brand/illustrations/pico-tip-vaccinated.svg?raw'
import wash from '@/assets/brand/illustrations/pico-tip-wash-hands.svg?raw'
import mask from '@/assets/brand/illustrations/pico-tip-wear-mask.svg?raw'
import WikiLayout from './WikiLayout.vue'

// English text of the Wiki (spec 72). Same sections and anchors as the Indonesian text.
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
  ['COVID-19 cannot live in hot and humid places.', 'The virus can survive and spread in hot and humid places.'],
  ['Cold weather and snow can kill the coronavirus.', 'Cold weather and snow cannot kill the coronavirus.'],
  ['A hot bath can prevent the coronavirus.', 'A hot bath cannot prevent the coronavirus.'],
  ['Hand dryers can kill the coronavirus.', 'Hand dryers cannot kill the coronavirus.'],
  ['Ultraviolet light can kill the coronavirus in the body.', 'No. UV light can irritate the skin.'],
  ['Spraying alcohol or chlorine over the whole body can kill the coronavirus.', 'A virus that is already inside the body cannot be killed this way.'],
  ['A pneumonia vaccine can protect against the coronavirus.', 'In 2020 there was no valid evidence that a pneumonia vaccine protects against the coronavirus.'],
]
</script>

<template>
  <WikiLayout :items="items">
    <section aria-labelledby="apa-itu">
      <h2 id="apa-itu">What COVID-19 is</h2>
      <p>COVID-19 is a disease caused by a new type of coronavirus. It was first detected in Wuhan, China.</p>
      <p>At first, many patients in Wuhan were linked to a seafood and animal market, which pointed to spread from animals to people. Later, more patients had never been to that market, so spread from person to person was taking place.</p>
      <p>The name coronavirus comes from the Latin <i>corona</i>, meaning crown or halo, because the virus looks like a crown.</p>
    </section>

    <section aria-labelledby="penularan">
      <h2 id="penularan">How it spreads</h2>
      <p>A person can catch COVID-19 from someone who has it. When that person coughs or sneezes, small droplets leave the nose and mouth. Other people can breathe them in, or the droplets land on nearby objects.</p>
      <p>If someone touches such an object and then touches their eyes, nose or mouth, they can also be infected.</p>
      <ul>
        <li>The main routes are droplets and close contact.</li>
        <li>Spread is easier when you are within about one metre of an infected person.</li>
        <li>People without symptoms can also pass the virus on.</li>
      </ul>
    </section>

    <section aria-labelledby="gejala">
      <h2 id="gejala" class="flex items-center gap-3"><PicoIcon name="symptoms" :size="24" class="text-indigo" /> Symptoms</h2>
      <p>Common symptoms are a fever of 38&nbsp;°C or more, a dry cough, shortness of breath and headache. Some people are infected without any symptoms.</p>
      <p>If you have symptoms, read <a href="#jika-terinfeksi">If you are infected</a>.</p>
    </section>

    <section aria-labelledby="pencegahan">
      <h2 id="pencegahan">How to prevent it</h2>
      <p>COVID-19 vaccination is available and recommended by the government. <ReviewTodo id="wiki-vaccine" note="replaces the 2020 sentence 'there is no vaccine yet'; medical reviewer to confirm the wording" /></p>
      <p>These steps also lower the risk of catching and passing on the virus:</p>
      <ol class="mt-3 pl-5">
        <li>Stay healthy and fit.</li>
        <li>Wash your hands with soap and water, or with an alcohol-based hand rub.</li>
        <li>When you cough or sneeze, cover your nose and mouth with a tissue or your sleeve, not your palm.</li>
        <li>Keep at least one metre away from others, especially from people who cough, have a cold, sneeze or have a fever.</li>
        <li>Avoid touching your eyes, nose and mouth.</li>
        <li>Wear a mask over your mouth and nose when you are sick or in public places.</li>
        <li>Put used tissues and masks in a bin, then wash your hands.</li>
        <li>Avoid contact with farm and wild animals, and do not eat meat that is not fully cooked.</li>
      </ol>
      <p>Keeping your distance (<i>physical distancing</i>) slows the spread. That keeps health services from being overwhelmed, so patients can be treated until they recover.</p>
      <div class="mt-5 grid grid-cols-2 gap-5">
        <TipFigure :svg="wash" caption="Wash your hands with soap and water." />
        <TipFigure :svg="mask" caption="Wear a mask when sick or in public places." />
        <TipFigure :svg="distance" caption="Keep about one metre apart." />
        <TipFigure :svg="vaccinated" caption="Follow the vaccination advice." />
      </div>
    </section>

    <section aria-labelledby="istilah">
      <h2 id="istilah">Key terms</h2>
      <p>These terms were used during the pandemic. The definitions are the ones used at the time.</p>
      <dl class="mt-3 [&_dd]:mt-1 [&_dt]:mt-4 [&_dt]:font-strong">
        <dt>Suspect (suspek)</dt>
        <dd>A person with an acute respiratory infection who, in the last 14 days, travelled to or lived in an area with local transmission, or had contact with a confirmed or probable case. A person with a severe respiratory infection or severe pneumonia that needs hospital care, with no other convincing cause, is also included.</dd>
        <dt>OTG (person without symptoms)</dt>
        <dd>A person in close contact with a confirmed COVID-19 case who has no symptoms such as fever, cough, sore throat or shortness of breath.</dd>
        <dt>ODP (person under monitoring)</dt>
        <dd>A person with a fever (38&nbsp;°C or more) or a history of fever, or mild breathing symptoms, with no other convincing cause, who in the last 14 days travelled to or lived in an area with local transmission.</dd>
        <dt>PDP (patient under supervision)</dt>
        <dd>A person with an acute respiratory infection, that is a fever (38&nbsp;°C or more) or a history of fever with respiratory symptoms such as cough, shortness of breath, sore throat, a cold or pneumonia, with no other convincing cause, who in the last 14 days travelled to or lived in an area with local transmission.</dd>
        <dd class="text-ink-muted">The terms ODP and PDP were replaced in July 2020 by suspected, probable, confirmed case and close contact. <ReviewTodo id="wiki-terms-source" note="cite the Ministry of Health guideline that replaced ODP and PDP in July 2020" /></dd>
        <dt>Close contact</dt>
        <dd>A person who has been in contact with a probable or confirmed COVID-19 case.</dd>
        <dt>Probable</dt>
        <dd>A suspected case with severe respiratory infection, acute respiratory failure (ARDS) or death, with a clinical picture that strongly suggests COVID-19, and no RT-PCR laboratory result yet.</dd>
        <dt>Home isolation (isolasi mandiri)</dt>
        <dd>Staying apart from other people while sick or waiting for a test result, as health workers advise. The guide is on the <RouterLink to="/en/isoman">Home isolation</RouterLink> page.</dd>
        <dt>Quarantine (karantina)</dt>
        <dd>Keeping people who may have been exposed to the virus apart from others, to see whether they fall ill.</dd>
        <dt>Rt (effective reproduction number)</dt>
        <dd>The average number of people infected by one infected person at a given time. An Rt above 1 means spread is growing, below 1 means it is shrinking. How it is calculated is on the <RouterLink to="/en/metodologi#rt">Methodology</RouterLink> page.</dd>
      </dl>
    </section>

    <section aria-labelledby="jika-terinfeksi">
      <h2 id="jika-terinfeksi">If you are infected</h2>
      <p>If you have symptoms or tested positive, contact your nearest community health centre or health facility and follow the advice of health workers.</p>
      <p>The home isolation guide and the danger signs are on the <RouterLink to="/en/isoman">Home isolation</RouterLink> page.</p>
      <p>The PeduliLindungi app is now SATUSEHAT Mobile. <ReviewTodo id="wiki-satusehat" note="owner to confirm this line or drop it (O-5a)" /></p>
    </section>

    <section aria-labelledby="mitos">
      <h2 id="mitos">Myths and facts</h2>
      <p>Some myths that spread during the pandemic:</p>
      <ul class="list-none pl-0">
        <li v-for="[myth, fact] in myths" :key="myth" class="rounded-sm border border-line p-3">
          <p class="m-0"><strong>Myth:</strong> {{ myth }}</p>
          <p class="m-0"><strong>Fact:</strong> {{ fact }}</p>
        </li>
      </ul>
    </section>
  </WikiLayout>
</template>

<script setup lang="ts">
import { useDownloadSizes } from '@/api/useSeries'
import { usePartners } from '@/api/useContent'
import { useFormat } from '@/app/useFormat'
import ProseLayout from '@/components/ProseLayout.vue'
import { API_BASE, COLUMN_DOCS, FACTS, REPO_URL, SWAGGER_URL } from '@/app/facts'

// English text of the Methodology page (spec 74). Same sections and anchors as the Indonesian text.
const f = useFormat()
const partners = usePartners()
const sizes = useDownloadSizes()
const d = (iso: string) => f.date(iso)
const kb = (n: number) => (n >= 1e6 ? `${f.num(n / 1e6, 1)} MB` : `${f.num(Math.max(1, Math.round(n / 1e3)))} KB`)
const items = [
  { id: 'sumber', label: 'Data sources' },
  { id: 'harian', label: 'Daily values' },
  { id: 'rt', label: 'Reproduction number (Rt)' },
  { id: 'kekosongan', label: 'Missing data' },
  { id: 'unduh', label: 'Download and API' },
  { id: 'lisensi', label: 'Data use and licence' },
  { id: 'kredit', label: 'Credits' },
]
const files = [
  ['indonesia', 'Indonesia'],
  ['provinsi', '34 provinces'],
  ['kabupaten-sulteng', '13 regencies and cities of Central Sulawesi'],
] as const
const sources = [
  ['https://regional.kompas.com/read/2022/08/12/152148078/kain-tenun-donggala-latar-belakang-motif-dan-warna?page=all', 'Kompas: Donggala woven cloth, background, motifs and colours'],
  ['https://palontaraq.id/2024/06/09/mengenal-batik-bomba-sulawesi-tengah/', 'Palontaraq: Getting to know Batik Bomba of Central Sulawesi'],
  ['https://www.goodnewsfromindonesia.id/2025/12/05/5-ragam-batik-khas-sulawesi-tengah-dengan-motif-ikoniknya', 'Good News from Indonesia: 5 batik styles of Central Sulawesi'],
  ['https://budaya-indonesia.org/Kain-Kulit-Kayu', 'Budaya Indonesia: Bark cloth'],
] as const
const avoided = [
  ['https://songulara.com/2026/08/enam-motif-batik-parigi-moutong-kantongi-hak-cipta-motif-saga-jadi-identitas-daerah/', 'Songulara: Six batik motifs of Parigi Moutong'],
  ['https://budaya-indonesia.org/Tenun-Nambo-si-penyejuk-hati', 'Budaya Indonesia: Nambo weaving'],
] as const
</script>

<template>
  <ProseLayout :items="items">
    <section aria-labelledby="sumber">
      <h2 id="sumber">Data sources</h2>
      <p>A program (a <i>scraper</i>) reads cumulative totals from a third-party site. Daily values are the difference between two consecutive days. The data is kept in a database, and an <a :href="API_BASE" rel="noopener">open API</a> serves it to this site.</p>
      <p>Coverage: Indonesia and 34 provinces from {{ d(FACTS.recordFirst) }} to {{ d(FACTS.recordLast) }}, and 13 regencies and cities of Central Sulawesi.</p>
      <p>The third-party site is <a href="https://m.andrafarm.com/" rel="noopener">m.andrafarm.com</a> (Andra Farm), its pages that list cases by province and by city. The site says its figures come from kemkes.go.id (pusatkrisis.kemkes.go.id), covid19.go.id and BNPB. That is the site's own statement, not a check made by PICO. The pages were read on 24 October 2026.</p>
      <p>Because the data is collected automatically from another source, PICO does not guarantee that it is exact. If it differs from an official source, the official source is right.</p>
      <p>Updates stopped on {{ d(FACTS.recordLast) }}. This site is an archive.</p>
    </section>

    <section aria-labelledby="harian">
      <h2 id="harian">Daily values</h2>
      <p>A daily value is that day's cumulative total minus the day before. It can be 0 on days without a report, and it can include late reports from earlier days.</p>
      <p>For that reason a single day says little. Look at an average over several days or at a longer trend.</p>
    </section>

    <section aria-labelledby="rt">
      <h2 id="rt">Reproduction number (Rt)</h2>
      <p>Rt is an estimate of the average number of people infected by one infected person at a given time. It is estimated with EpiEstim (Cori et al., 2013) in R, from new daily cases.</p>
      <ul class="list-disc">
        <li>Serial interval (the time between symptoms in one case and in the case it infects): parametric, mean {{ f.num(FACTS.serialMean, 1) }} days, standard deviation {{ f.num(FACTS.serialSd, 1) }} days.</li>
        <li>Window: {{ FACTS.windowDays }} days. Each value is labelled at the end of its window.</li>
        <li>Rt is not computed (empty) for a window with fewer than {{ FACTS.minCases }} new cases. That is why Rt is missing early in the pandemic, in quiet periods, and after mid-2023.</li>
        <li>The page shows the estimate and its 95% credible interval. An Rt above 1 means spread is growing, below 1 means it is shrinking. The interval matters more than the single number.</li>
        <li>Last values: national {{ d(FACTS.rtLastNational) }}, Central Sulawesi {{ d(FACTS.rtLastSulteng) }}.</li>
      </ul>
    </section>

    <section aria-labelledby="kekosongan">
      <h2 id="kekosongan">Missing data</h2>
      <ul class="list-disc">
        <li>ODP and PDP stop after {{ d(FACTS.odpEnd) }} for Central Sulawesi. The source no longer reported them, so tables show &ldquo;not available&rdquo;, not 0.</li>
        <li>The gender and age data is one snapshot without a date. It is shown as the latest data available.</li>
        <li>Test data stops on {{ d(FACTS.testsEnd) }}.</li>
        <li>Vaccination data stops on {{ d(FACTS.vaccinationEnd) }}.</li>
        <li>Regency and city data has no figure for patients under treatment.</li>
        <li>Images from the old server are gone.</li>
      </ul>
    </section>

    <section aria-labelledby="unduh">
      <h2 id="unduh">Download and API</h2>
      <p>One file per level, with every date, in long format: one row per area per day. Available as CSV and XLSX.</p>
      <ul class="list-disc">
        <li v-for="[file, label] in files" :key="file">
          {{ label }}:
          <a :href="`/unduh/${file}.csv`" download>CSV<template v-if="sizes.data.value?.[file]"> ({{ kb(sizes.data.value[file]!.csv) }})</template></a>,
          <a :href="`/unduh/${file}.xlsx`" download>XLSX<template v-if="sizes.data.value?.[file]"> ({{ kb(sizes.data.value[file]!.xlsx) }})</template></a>
        </li>
      </ul>
      <p>Columns in the files:</p>
      <div class="max-w-full overflow-x-auto" role="region" tabindex="0" aria-label="Columns of the download files">
        <table class="w-full border-collapse text-sm">
          <thead><tr class="bg-tint"><th scope="col" class="px-2 py-1 text-left">Column</th><th scope="col" class="px-2 py-1 text-left">Content</th></tr></thead>
          <tbody>
            <tr v-for="(text, col) in COLUMN_DOCS.en" :key="col" class="border-t border-line">
              <th scope="row" class="px-2 py-1 text-left font-normal"><code>{{ col }}</code></th>
              <td class="px-2 py-1">{{ text }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>For Excel, open the CSV through <i>Data &gt; From Text/CSV</i> and choose UTF-8 encoding. The XLSX files open directly.</p>
      <p>For access from a program, use the open API at <a :href="API_BASE" rel="noopener">{{ API_BASE }}</a>. The documentation is in <a :href="SWAGGER_URL" rel="noopener">Swagger</a>.</p>
    </section>

    <section aria-labelledby="lisensi">
      <h2 id="lisensi">Data use and licence</h2>
      <p>PICO did not create the original data. m.andrafarm.com allows its information to be copied and pasted as long as the main source is credited, and it names no licence. PICO grants no licence for this data. If you use it, please credit PICO Sulteng, m.andrafarm.com and the original source (the Ministry of Health).</p>
      <p>The code of this site is open on <a :href="REPO_URL" rel="noopener">GitHub</a> under the MIT licence. The licence covers the code only. The PICO logo, the pictures, the weave patterns and the data are not automatically part of it.</p>
      <p>Map data: the boundary files (sulteng.json and indonesia.json) come from the old PICO project and have been in the repository since 23 May 2020. The original author and licence were not recorded. They are used for visualisation only. The maps may be replaced by BPS boundaries later.</p>
    </section>

    <section aria-labelledby="kredit">
      <h2 id="kredit">Credits</h2>
      <h3>Partners</h3>
      <ul v-if="partners.data.value?.length" class="list-disc">
        <li v-for="p in partners.data.value" :key="p.id"><a v-if="p.href" :href="p.href" rel="noopener">{{ p.name }}</a><template v-else>{{ p.name }}</template></li>
      </ul>
      <h3>Brand and type</h3>
      <p>The PICO logo is the owner's legacy logo, unchanged. The small pictures on the home page and the Wiki (hand washing, mask, symptoms) come from the old PICO dashboard. The icons were drawn for PICO. Type: Nunito (OFL licence).</p>
      <h3>Cultural note</h3>
      <p>This site no longer shows weaving motifs. The note below stays because the motif files are still in the repository history and in the PICO brand repository.</p>
      <p>Kaili motifs are communal heritage of the Kaili people. They do not belong to PICO. Every kabupaten pattern is an interpretation drawn from written descriptions. None is an authentic reproduction, and no photograph of real cloth was used.</p>
      <ul class="list-disc">
        <li>Sourced motifs (interpretations): Donggala, that is Buya Subi (diamond field and flowering vine) and the Buya Bomba Kota check; Kota Palu, that is a simple vine-and-flower bomba from Batik Bomba; Poso, that is bark-cloth tumpal and diamond in natural brown and cream.</li>
        <li>Stylised, not traditional: Banggai, Morowali, Parigi Moutong, Sigi, Tolitoli, Morowali Utara, Tojo Una-Una, Buol, Banggai Kepulauan and Banggai Laut use original plain-weave structures.</li>
        <li>Not used: Taiganja and Sambulugana, because they are sacred Kaili adat objects; white fuya ritual cloth cues; Buya Sabe in any funeral context; the registered batik of Parigi Moutong (Saga), Buol and Morowali (Ikzara, Tobungku).</li>
      </ul>
      <p>Sources read and used for drawing:</p>
      <ul class="list-disc"><li v-for="[href, label] in sources" :key="href"><a :href="href" rel="noopener">{{ label }}</a></li></ul>
      <p>Sources read to decide what not to copy:</p>
      <ul class="list-disc"><li v-for="[href, label] in avoided" :key="href"><a :href="href" rel="noopener">{{ label }}</a></li></ul>
      <p>These motifs have not been reviewed by Dinas Kebudayaan Sulawesi Tengah or Dekranasda. The artwork is drawn from written descriptions, not from photographs of real cloth. The motifs are not for commercial use.</p>
    </section>
  </ProseLayout>
</template>

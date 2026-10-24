<script setup lang="ts">
import { RouterLink } from 'vue-router'
import TipFigure from '@/components/TipFigure.vue'
import PicoIcon from '@/components/PicoIcon.vue'
import distance from '@/assets/brand/illustrations/pico-tip-keep-distance.svg?raw'
import vaccinated from '@/assets/brand/illustrations/pico-tip-vaccinated.svg?raw'
import wash from '@/assets/brand/illustrations/pico-tip-wash-hands.svg?raw'
import mask from '@/assets/brand/illustrations/pico-tip-wear-mask.svg?raw'
import WikiLayout from './WikiLayout.vue'

// Indonesian text of the Wiki (spec 72). Ported from the 2020 site, then cut to the claims that a public source supports (WHO, Kementerian Kesehatan RI). The sources are listed at the end of the page.
const items = [
  { id: 'apa-itu', label: 'Apa itu COVID-19' },
  { id: 'penularan', label: 'Cara penularan' },
  { id: 'gejala', label: 'Gejala' },
  { id: 'pencegahan', label: 'Cara mencegah' },
  { id: 'istilah', label: 'Istilah penting' },
  { id: 'jika-terinfeksi', label: 'Jika terinfeksi' },
  { id: 'mitos', label: 'Mitos dan fakta' },
]
const myths: [string, string][] = [
  ['COVID-19 tidak bisa menular di area beriklim panas dan lembap.', 'Virus ini bisa menular di area beriklim panas dan lembap.'],
  ['Cuaca dingin dan salju bisa membunuh coronavirus.', 'Cuaca dingin dan salju tidak bisa membunuh coronavirus.'],
  ['Pengering tangan (hand dryer) bisa membunuh coronavirus.', 'Pengering tangan tidak efektif membunuh coronavirus. Cuci tangan dengan sabun dan air, atau pakai hand-rub berbasis alkohol.'],
  ['Menyemprotkan pemutih atau disinfektan ke tubuh bisa membunuh coronavirus.', 'Jangan menyemprotkan atau memasukkan pemutih atau disinfektan apa pun ke tubuh. Zat itu beracun bila tertelan dan merusak kulit dan mata.'],
]
</script>

<template>
  <WikiLayout :items="items">
    <section aria-labelledby="apa-itu">
      <h2 id="apa-itu">Apa itu COVID-19</h2>
      <p>COVID-19 adalah penyakit menular yang disebabkan oleh virus SARS-CoV-2, sejenis coronavirus.</p>
    </section>

    <section aria-labelledby="penularan">
      <h2 id="penularan">Cara penularan</h2>
      <p>Virus keluar dari mulut atau hidung orang yang terinfeksi dalam partikel cairan kecil. Orang lain bisa menghirupnya. Penularan terutama terjadi antara orang yang berdekatan, dan risikonya naik bila berdekatan lama.</p>
      <p>Orang juga bisa tertular bila menyentuh mata, hidung atau mulut setelah menyentuh permukaan yang tercemar.</p>
      <ul>
        <li>Ruangan tertutup dengan ventilasi buruk lebih berisiko.</li>
        <li>Orang yang tidak bergejala juga dapat menularkan virus, walau seberapa sering itu terjadi belum jelas.</li>
      </ul>
    </section>

    <section aria-labelledby="gejala">
      <h2 id="gejala" class="flex items-center gap-3"><PicoIcon name="symptoms" :size="24" class="text-indigo" /> Gejala</h2>
      <p>Gejala yang paling umum adalah demam, batuk, lelah, dan hilangnya penciuman atau pengecapan. Gejala lain antara lain sakit tenggorokan, sakit kepala, dan nyeri otot. Tanda yang serius adalah sulit bernapas atau sesak napas. Sebagian orang terinfeksi tanpa gejala.</p>
      <p>Bila Anda bergejala, baca bagian <a href="#jika-terinfeksi">Jika terinfeksi</a>.</p>
    </section>

    <section aria-labelledby="pencegahan">
      <h2 id="pencegahan">Cara mencegah</h2>
      <p>Vaksin COVID-19 melindungi dari sakit berat dan kematian akibat COVID-19 (WHO). Tanyakan ke puskesmas atau fasilitas kesehatan terdekat apakah vaksin tersedia dan apakah Anda perlu divaksin.</p>
      <p>Selain itu, cara berikut mengurangi risiko tertular dan menularkan:</p>
      <ol class="mt-3 pl-5">
        <li>Cuci tangan dengan air dan sabun, atau dengan <i>hand-rub</i> berbasis alkohol.</li>
        <li>Saat batuk atau bersin, tutup hidung dan mulut.</li>
        <li>Jaga jarak sekurang-kurangnya satu meter dari orang lain, walau mereka tampak sehat.</li>
        <li>Pakai masker yang pas bila tidak bisa menjaga jarak, atau di ruangan yang ventilasinya buruk.</li>
        <li>Di dalam ruangan, buka jendela agar udara luar masuk.</li>
      </ol>
      <div class="mt-5 grid grid-cols-2 gap-5">
        <TipFigure :svg="wash" caption="Cuci tangan dengan air dan sabun." />
        <TipFigure :svg="mask" caption="Pakai masker bila tidak bisa menjaga jarak." />
        <TipFigure :svg="distance" caption="Jaga jarak sekitar satu meter." />
        <TipFigure :svg="vaccinated" caption="Tanyakan soal vaksinasi ke fasilitas kesehatan." />
      </div>
    </section>

    <section aria-labelledby="istilah">
      <h2 id="istilah">Istilah penting</h2>
      <p>Pada 13 Juli 2020 Menteri Kesehatan menetapkan Keputusan Nomor HK.01.07/MENKES/413/2020. Kementerian Kesehatan merilisnya pada 14 Juli 2020. Istilah ODP (orang dalam pemantauan), PDP (pasien dalam pengawasan) dan OTG (orang tanpa gejala) diganti dengan istilah di bawah ini. Definisinya mengikuti keputusan itu.</p>
      <dl class="mt-3 [&_dd]:mt-1 [&_dt]:mt-4 [&_dt]:font-strong">
        <dt>Suspek</dt>
        <dd>Orang dengan infeksi saluran pernapasan akut (ISPA) yang dalam 14 hari sebelum gejala pernah bepergian ke atau tinggal di wilayah dengan penularan lokal, atau berkontak dengan kasus konfirmasi atau probable. Orang dengan ISPA berat atau pneumonia berat yang butuh perawatan rumah sakit, tanpa penyebab lain yang meyakinkan, juga termasuk.</dd>
        <dt>Probable</dt>
        <dd>Kasus suspek dengan ISPA berat, gagal napas akut (ARDS) atau meninggal, dengan gambaran klinis yang meyakinkan COVID-19, dan belum ada hasil pemeriksaan laboratorium RT-PCR.</dd>
        <dt>Konfirmasi</dt>
        <dd>Orang yang dinyatakan positif COVID-19 lewat pemeriksaan laboratorium RT-PCR. Ada yang bergejala dan ada yang tanpa gejala.</dd>
        <dt>Kontak erat</dt>
        <dd>Orang yang pernah berkontak dengan kasus probable atau konfirmasi COVID-19.</dd>
        <dt>Rt (angka reproduksi efektif)</dt>
        <dd>Rata-rata jumlah orang yang tertular dari satu orang terinfeksi pada waktu tertentu. Rt di atas 1 berarti penularan bertambah, di bawah 1 berarti berkurang. Cara menghitungnya ada di halaman <RouterLink to="/metodologi#rt">Metodologi</RouterLink>.</dd>
      </dl>
    </section>

    <section aria-labelledby="jika-terinfeksi">
      <h2 id="jika-terinfeksi">Jika terinfeksi</h2>
      <p>Bila Anda bergejala atau dinyatakan positif, hubungi puskesmas atau fasilitas kesehatan terdekat dan ikuti arahan tenaga kesehatan.</p>
      <p>Panduan isolasi mandiri dan tanda bahaya ada di halaman <RouterLink to="/isoman">Isoman</RouterLink>.</p>
      <p>Sejak 1 Maret 2023 aplikasi PeduliLindungi menjadi SATUSEHAT Mobile.</p>
    </section>

    <section aria-labelledby="mitos">
      <h2 id="mitos">Mitos dan fakta</h2>
      <p>Beberapa mitos yang beredar pada masa pandemi, dan jawaban WHO:</p>
      <ul class="list-none pl-0">
        <li v-for="[myth, fact] in myths" :key="myth" class="rounded-sm border border-line p-3">
          <p class="m-0"><strong>Mitos:</strong> {{ myth }}</p>
          <p class="m-0"><strong>Fakta:</strong> {{ fact }}</p>
        </li>
      </ul>
    </section>
    <p class="mt-8 text-sm text-ink-muted">Isi halaman ini mengikuti sumber publik berikut, per 24 Oktober 2026, dan belum ditinjau oleh tenaga medis: <a href="https://www.who.int/news-room/questions-and-answers/item/coronavirus-disease-covid-19-how-is-it-transmitted" rel="noopener">WHO, cara penularan</a> (23 Desember 2021); <a href="https://www.who.int/health-topics/coronavirus" rel="noopener">WHO, gejala dan pencegahan</a>; <a href="https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters" rel="noopener">WHO, mitos</a> (19 Januari 2022); <a href="https://www.who.int/news-room/questions-and-answers/item/coronavirus-disease-(covid-19)-vaccines" rel="noopener">WHO, vaksin COVID-19</a>; <a href="https://kemkes.go.id/eng/%20kemenkes-kenalkan-istilah-probable-suspect-kontak-erat-dan-terkonfirmasi-covid-19" rel="noopener">Kemenkes, istilah kasus (14 Juli 2020)</a>; <a href="https://kemkes.go.id/id/besok-pedulilindungi-resmi-bertransformasi-menjadi-satusehat-mobile" rel="noopener">Kemenkes, SATUSEHAT Mobile (28 Februari 2023)</a>.</p>
  </WikiLayout>
</template>

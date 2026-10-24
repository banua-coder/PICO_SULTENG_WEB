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

// Indonesian text of the Wiki (spec 72). Ported from the 2020 site and trimmed to what is safe to keep (see the task Outcome for what was dropped).
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
  ['COVID-19 tidak bisa hidup di area beriklim panas dan lembap.', 'Virus ini bisa bertahan dan menular di area beriklim panas dan lembap.'],
  ['Cuaca dingin dan salju bisa membunuh coronavirus.', 'Cuaca dingin dan salju tidak bisa membunuh coronavirus.'],
  ['Mandi air panas bisa mencegah coronavirus.', 'Mandi air panas tidak bisa mencegah coronavirus.'],
  ['Pengering tangan (hand dryer) bisa membunuh coronavirus.', 'Pengering tangan tidak bisa membunuh coronavirus.'],
  ['Sinar ultraviolet bisa membunuh coronavirus di tubuh.', 'Tidak. Sinar UV dapat menyebabkan iritasi pada kulit.'],
  ['Menyemprotkan alkohol atau klorin ke seluruh tubuh bisa membunuh coronavirus.', 'Virus yang sudah masuk ke dalam tubuh tidak bisa dibunuh dengan cara itu.'],
  ['Vaksin pneumonia bisa melindungi dari coronavirus.', 'Pada 2020 belum ada bukti yang valid bahwa vaksin pneumonia melindungi dari coronavirus.'],
]
</script>

<template>
  <WikiLayout :items="items">
    <section aria-labelledby="apa-itu">
      <h2 id="apa-itu">Apa itu COVID-19</h2>
      <p>COVID-19 adalah penyakit yang disebabkan oleh virus corona jenis baru. Virus ini pertama kali terdeteksi di Wuhan, China.</p>
      <p>Pada awalnya banyak pasien di Wuhan dikaitkan dengan pasar makanan laut dan hewan, yang menunjukkan penularan dari hewan ke orang. Kemudian makin banyak pasien yang tidak pernah ke pasar itu, sehingga penularan dari orang ke orang terjadi.</p>
      <p>Nama coronavirus berasal dari bahasa Latin <i>corona</i>, yang berarti mahkota atau halo, karena bentuk virusnya menyerupai mahkota.</p>
    </section>

    <section aria-labelledby="penularan">
      <h2 id="penularan">Cara penularan</h2>
      <p>Seseorang dapat tertular dari penderita COVID-19. Saat penderita batuk atau bersin, tetesan kecil (<i>droplet</i>) keluar dari hidung dan mulut. Tetesan itu bisa terhirup orang lain, atau jatuh ke benda di sekitar.</p>
      <p>Bila orang lain menyentuh benda itu lalu menyentuh mata, hidung atau mulut, ia juga bisa tertular.</p>
      <ul>
        <li>Sumber penularan utama adalah droplet dan kontak dekat.</li>
        <li>Penularan terjadi lebih mudah bila tidak ada jarak, sekitar satu meter, dengan penderita.</li>
        <li>Orang yang tidak bergejala juga dapat menularkan virus ke orang lain.</li>
      </ul>
    </section>

    <section aria-labelledby="gejala">
      <h2 id="gejala" class="flex items-center gap-3"><PicoIcon name="symptoms" :size="24" class="text-indigo" /> Gejala</h2>
      <p>Gejala yang umum adalah demam 38&nbsp;°C atau lebih, batuk kering, sesak napas, dan sakit kepala. Sebagian orang terinfeksi tanpa gejala.</p>
      <p>Bila Anda bergejala, baca bagian <a href="#jika-terinfeksi">Jika terinfeksi</a>.</p>
    </section>

    <section aria-labelledby="pencegahan">
      <h2 id="pencegahan">Cara mencegah</h2>
      <p>Vaksinasi COVID-19 tersedia dan dianjurkan pemerintah. <ReviewTodo id="wiki-vaccine" note="replaces the 2020 sentence 'there is no vaccine yet'; medical reviewer to confirm the wording" /></p>
      <p>Selain itu, cara berikut mengurangi risiko tertular dan menularkan:</p>
      <ol class="mt-3 pl-5">
        <li>Jaga kesehatan dan kebugaran.</li>
        <li>Cuci tangan dengan air dan sabun, atau dengan <i>hand-rub</i> berbasis alkohol.</li>
        <li>Saat batuk atau bersin, tutup hidung dan mulut dengan tisu atau lengan, bukan telapak tangan.</li>
        <li>Jaga jarak sekurang-kurangnya satu meter, terutama dari orang yang batuk, pilek, bersin atau demam.</li>
        <li>Hindari menyentuh mata, hidung dan mulut.</li>
        <li>Pakai masker penutup mulut dan hidung saat sakit atau di tempat umum.</li>
        <li>Buang tisu dan masker bekas ke tempat sampah, lalu cuci tangan.</li>
        <li>Hindari kontak dengan hewan ternak dan hewan liar, dan jangan makan daging yang belum matang.</li>
      </ol>
      <p>Menjaga jarak (<i>physical distancing</i>) memperlambat penularan. Dengan begitu layanan kesehatan tidak kewalahan dan pasien dapat dirawat sampai sembuh.</p>
      <div class="mt-5 grid grid-cols-2 gap-5">
        <TipFigure :svg="wash" caption="Cuci tangan dengan air dan sabun." />
        <TipFigure :svg="mask" caption="Pakai masker saat sakit atau di tempat umum." />
        <TipFigure :svg="distance" caption="Jaga jarak sekitar satu meter." />
        <TipFigure :svg="vaccinated" caption="Ikuti anjuran vaksinasi." />
      </div>
    </section>

    <section aria-labelledby="istilah">
      <h2 id="istilah">Istilah penting</h2>
      <p>Istilah ini dipakai selama pandemi. Definisinya adalah yang dipakai pada masa itu.</p>
      <dl class="mt-3 [&_dd]:mt-1 [&_dt]:mt-4 [&_dt]:font-strong">
        <dt>Suspek</dt>
        <dd>Orang dengan infeksi saluran pernapasan akut (ISPA) yang dalam 14 hari terakhir pernah bepergian ke atau tinggal di wilayah dengan penularan lokal, atau berkontak dengan kasus terkonfirmasi atau probable. Orang dengan ISPA berat atau pneumonia berat yang butuh perawatan rumah sakit, tanpa penyebab lain yang meyakinkan, juga termasuk.</dd>
        <dt>OTG (Orang Tanpa Gejala)</dt>
        <dd>Orang yang berkontak erat dengan kasus terkonfirmasi COVID-19 tetapi tidak bergejala, seperti demam, batuk, radang tenggorokan atau sesak napas.</dd>
        <dt>ODP (Orang Dalam Pemantauan)</dt>
        <dd>Orang dengan demam (38&nbsp;°C atau lebih) atau riwayat demam, atau gejala gangguan pernapasan ringan, tanpa penyebab lain yang meyakinkan, dan dalam 14 hari terakhir pernah bepergian ke atau tinggal di wilayah dengan penularan lokal.</dd>
        <dt>PDP (Pasien Dalam Pengawasan)</dt>
        <dd>Orang dengan ISPA, yaitu demam (38&nbsp;°C atau lebih) atau riwayat demam disertai gejala pernapasan seperti batuk, sesak napas, sakit tenggorokan, pilek, atau pneumonia, tanpa penyebab lain yang meyakinkan, dan dalam 14 hari terakhir pernah bepergian ke atau tinggal di wilayah dengan penularan lokal.</dd>
        <dd class="text-ink-muted">Istilah ODP dan PDP diganti pada Juli 2020 oleh kasus suspek, probable, konfirmasi dan kontak erat. <ReviewTodo id="wiki-terms-source" note="cite the Ministry of Health guideline that replaced ODP and PDP in July 2020" /></dd>
        <dt>Kontak erat</dt>
        <dd>Orang yang pernah berkontak dengan kasus probable atau terkonfirmasi COVID-19.</dd>
        <dt>Probable</dt>
        <dd>Kasus suspek dengan ISPA berat, gagal napas akut (ARDS) atau meninggal, dengan gambaran klinis yang meyakinkan COVID-19, dan belum ada hasil pemeriksaan laboratorium RT-PCR.</dd>
        <dt>Isolasi mandiri</dt>
        <dd>Tinggal terpisah dari orang lain selama sakit atau menunggu hasil pemeriksaan, sesuai arahan tenaga kesehatan. Panduannya ada di halaman <RouterLink to="/isoman">Isoman</RouterLink>.</dd>
        <dt>Karantina</dt>
        <dd>Memisahkan orang yang mungkin terpapar virus dari orang lain, untuk melihat apakah ia jatuh sakit.</dd>
        <dt>Rt (angka reproduksi efektif)</dt>
        <dd>Rata-rata jumlah orang yang tertular dari satu orang terinfeksi pada waktu tertentu. Rt di atas 1 berarti penularan bertambah, di bawah 1 berarti berkurang. Cara menghitungnya ada di halaman <RouterLink to="/metodologi#rt">Metodologi</RouterLink>.</dd>
      </dl>
    </section>

    <section aria-labelledby="jika-terinfeksi">
      <h2 id="jika-terinfeksi">Jika terinfeksi</h2>
      <p>Bila Anda bergejala atau dinyatakan positif, hubungi puskesmas atau fasilitas kesehatan terdekat dan ikuti arahan tenaga kesehatan.</p>
      <p>Panduan isolasi mandiri dan tanda bahaya ada di halaman <RouterLink to="/isoman">Isoman</RouterLink>.</p>
      <p>Aplikasi PeduliLindungi kini menjadi SATUSEHAT Mobile. <ReviewTodo id="wiki-satusehat" note="owner to confirm this line or drop it (O-5a)" /></p>
    </section>

    <section aria-labelledby="mitos">
      <h2 id="mitos">Mitos dan fakta</h2>
      <p>Beberapa mitos yang beredar pada masa pandemi:</p>
      <ul class="list-none pl-0">
        <li v-for="[myth, fact] in myths" :key="myth" class="rounded-sm border border-line p-3">
          <p class="m-0"><strong>Mitos:</strong> {{ myth }}</p>
          <p class="m-0"><strong>Fakta:</strong> {{ fact }}</p>
        </li>
      </ul>
    </section>
  </WikiLayout>
</template>

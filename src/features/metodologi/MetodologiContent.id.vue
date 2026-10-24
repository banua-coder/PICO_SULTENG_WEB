<script setup lang="ts">
import { useDownloadSizes } from '@/api/useSeries'
import { usePartners } from '@/api/useContent'
import { useFormat } from '@/app/useFormat'
import ProseLayout from '@/components/ProseLayout.vue'
import ReviewTodo from '@/components/ReviewTodo.vue'
import { API_BASE, COLUMN_DOCS, FACTS, REPO_URL, SWAGGER_URL } from '@/app/facts'

// Indonesian text of the Methodology page (spec 74). Every figure comes from FACTS, which facts.test.ts checks against the data.
const f = useFormat()
const partners = usePartners()
const sizes = useDownloadSizes()
const d = (iso: string) => f.date(iso)
const kb = (n: number) => (n >= 1e6 ? `${f.num(n / 1e6, 1)} MB` : `${f.num(Math.max(1, Math.round(n / 1e3)))} KB`)
const items = [
  { id: 'sumber', label: 'Sumber data' },
  { id: 'harian', label: 'Nilai harian' },
  { id: 'rt', label: 'Angka reproduksi (Rt)' },
  { id: 'kekosongan', label: 'Data yang kosong' },
  { id: 'unduh', label: 'Unduh dan API' },
  { id: 'lisensi', label: 'Penggunaan data dan lisensi' },
  { id: 'kredit', label: 'Kredit' },
]
const files = [
  ['indonesia', 'Indonesia'],
  ['provinsi', '34 provinsi'],
  ['kabupaten-sulteng', '13 kabupaten/kota Sulawesi Tengah'],
] as const
const sources = [
  ['https://regional.kompas.com/read/2022/08/12/152148078/kain-tenun-donggala-latar-belakang-motif-dan-warna?page=all', 'Kompas: Kain tenun Donggala, latar belakang, motif dan warna'],
  ['https://palontaraq.id/2024/06/09/mengenal-batik-bomba-sulawesi-tengah/', 'Palontaraq: Mengenal Batik Bomba Sulawesi Tengah'],
  ['https://www.goodnewsfromindonesia.id/2025/12/05/5-ragam-batik-khas-sulawesi-tengah-dengan-motif-ikoniknya', 'Good News from Indonesia: 5 ragam batik khas Sulawesi Tengah'],
  ['https://budaya-indonesia.org/Kain-Kulit-Kayu', 'Budaya Indonesia: Kain kulit kayu'],
] as const
const avoided = [
  ['https://songulara.com/2026/08/enam-motif-batik-parigi-moutong-kantongi-hak-cipta-motif-saga-jadi-identitas-daerah/', 'Songulara: Enam motif batik Parigi Moutong'],
  ['https://budaya-indonesia.org/Tenun-Nambo-si-penyejuk-hati', 'Budaya Indonesia: Tenun Nambo'],
] as const
</script>

<template>
  <ProseLayout :items="items">
    <section aria-labelledby="sumber">
      <h2 id="sumber">Sumber data</h2>
      <p>Sebuah program (<i>scraper</i>) membaca angka kumulatif dari situs pihak ketiga. Nilai harian dihitung sebagai selisih dua hari berturut-turut. Data disimpan dalam basis data, dan sebuah <a :href="API_BASE" rel="noopener">API terbuka</a> melayaninya ke situs ini.</p>
      <p>Cakupan: Indonesia dan 34 provinsi dari {{ d(FACTS.recordFirst) }} sampai {{ d(FACTS.recordLast) }}, serta 13 kabupaten/kota di Sulawesi Tengah.</p>
      <p>Angka nasional dan provinsi berasal dari sebuah situs pihak ketiga. <ReviewTodo id="metodologi-sumber" note="owner to name the upstream source of the national and province figures (O-11)" /></p>
      <p>Karena data diambil otomatis dari sumber lain, PICO tidak menjamin ketepatannya. Bila ada selisih dengan sumber resmi, sumber resminya yang benar.</p>
      <p>Pembaruan data berhenti pada {{ d(FACTS.recordLast) }}. Situs ini adalah arsip.</p>
    </section>

    <section aria-labelledby="harian">
      <h2 id="harian">Nilai harian</h2>
      <p>Nilai harian adalah selisih total kumulatif hari itu dengan hari sebelumnya. Nilainya bisa 0 pada hari tanpa laporan, dan bisa memuat laporan terlambat dari hari-hari sebelumnya.</p>
      <p>Karena itu satu hari saja tidak berarti banyak. Lihat rata-rata beberapa hari atau tren yang lebih panjang.</p>
    </section>

    <section aria-labelledby="rt">
      <h2 id="rt">Angka reproduksi (Rt)</h2>
      <p>Rt adalah perkiraan rata-rata jumlah orang yang tertular dari satu orang terinfeksi pada waktu tertentu. Rt diperkirakan dengan EpiEstim (Cori dkk., 2013) di R, dari kasus baru harian.</p>
      <ul class="list-disc">
        <li>Selang serial (waktu antara gejala satu kasus dan kasus yang ditularinya): parametrik, rata-rata {{ f.num(FACTS.serialMean, 1) }} hari, simpangan baku {{ f.num(FACTS.serialSd, 1) }} hari.</li>
        <li>Jendela: {{ FACTS.windowDays }} hari. Setiap nilai diberi tanggal akhir jendelanya.</li>
        <li>Rt tidak dihitung (kosong) untuk jendela dengan kasus baru kurang dari {{ FACTS.minCases }}. Karena itu Rt kosong pada awal pandemi, pada masa tenang, dan setelah pertengahan 2023.</li>
        <li>Yang ditampilkan adalah perkiraan dan rentang kredibel 95%. Rt di atas 1 berarti penularan bertambah, di bawah 1 berarti berkurang. Rentangnya lebih penting daripada satu angka.</li>
        <li>Nilai terakhir: nasional {{ d(FACTS.rtLastNational) }}, Sulawesi Tengah {{ d(FACTS.rtLastSulteng) }}.</li>
      </ul>
    </section>

    <section aria-labelledby="kekosongan">
      <h2 id="kekosongan">Data yang kosong</h2>
      <ul class="list-disc">
        <li>ODP dan PDP berhenti setelah {{ d(FACTS.odpEnd) }} untuk Sulawesi Tengah. Sumbernya tidak lagi melaporkannya, jadi tabel menampilkan &ldquo;tidak tersedia&rdquo;, bukan 0.</li>
        <li>Data jenis kelamin dan usia adalah satu potret tanpa tanggal. Ditampilkan sebagai data terakhir yang tersedia.</li>
        <li>Data pemeriksaan (tes) berhenti pada {{ d(FACTS.testsEnd) }}.</li>
        <li>Data vaksinasi berhenti pada {{ d(FACTS.vaccinationEnd) }}.</li>
        <li>Data per kabupaten/kota tidak punya angka pasien dirawat.</li>
        <li>Gambar dari server lama tidak ada lagi.</li>
      </ul>
    </section>

    <section aria-labelledby="unduh">
      <h2 id="unduh">Unduh dan API</h2>
      <p>Satu berkas per tingkat, memuat semua tanggal, dalam format panjang: satu baris per wilayah per hari. Tersedia sebagai CSV dan XLSX.</p>
      <ul class="list-disc">
        <li v-for="[file, label] in files" :key="file">
          {{ label }}:
          <a :href="`/unduh/${file}.csv`" download>CSV<template v-if="sizes.data.value?.[file]"> ({{ kb(sizes.data.value[file]!.csv) }})</template></a>,
          <a :href="`/unduh/${file}.xlsx`" download>XLSX<template v-if="sizes.data.value?.[file]"> ({{ kb(sizes.data.value[file]!.xlsx) }})</template></a>
        </li>
      </ul>
      <p>Kolom pada berkas:</p>
      <div class="max-w-full overflow-x-auto" role="region" tabindex="0" aria-label="Kolom berkas unduhan">
        <table class="w-full border-collapse text-sm">
          <thead><tr class="bg-tint"><th scope="col" class="px-3 py-2 text-left">Kolom</th><th scope="col" class="px-3 py-2 text-left">Isi</th></tr></thead>
          <tbody>
            <tr v-for="(text, col) in COLUMN_DOCS.id" :key="col" class="border-t border-line">
              <th scope="row" class="px-3 py-2 text-left font-normal"><code>{{ col }}</code></th>
              <td class="px-3 py-2">{{ text }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Untuk Excel, buka CSV lewat <i>Data &gt; From Text/CSV</i> dan pilih pengodean UTF-8. Berkas XLSX bisa dibuka langsung.</p>
      <p>Untuk akses lewat program, pakai API terbuka di <a :href="API_BASE" rel="noopener">{{ API_BASE }}</a>. Dokumentasinya ada di <a :href="SWAGGER_URL" rel="noopener">Swagger</a>.</p>
    </section>

    <section aria-labelledby="lisensi">
      <h2 id="lisensi">Penggunaan data dan lisensi</h2>
      <p>Data asalnya bukan buatan PICO, jadi PICO tidak menyebut lisensi untuknya. Bila Anda memakai data ini, mohon cantumkan PICO Sulteng dan sumber aslinya. <ReviewTodo id="metodologi-lisensi" note="owner to confirm the data-terms wording (O-9, decided: credit only)" /></p>
      <p>Kode situs ini terbuka di <a :href="REPO_URL" rel="noopener">GitHub</a>. <ReviewTodo id="metodologi-kode" note="the repository has no LICENSE file; the owner must choose the code licence (the spec says MIT) and add the file" /></p>
      <p>Data peta: PICO (data peta lama). <ReviewTodo id="metodologi-peta" note="origin and licence of the map data are unknown (O-6); the credit is the default" /></p>
    </section>

    <section aria-labelledby="kredit">
      <h2 id="kredit">Kredit</h2>
      <h3>Mitra</h3>
      <ul v-if="partners.data.value?.length" class="list-disc">
        <li v-for="p in partners.data.value" :key="p.id"><a v-if="p.href" :href="p.href" rel="noopener">{{ p.name }}</a><template v-else>{{ p.name }}</template></li>
      </ul>
      <h3>Merek dan huruf</h3>
      <p>Logo PICO adalah logo lama milik pemilik, tidak diubah. Ilustrasi dan ikon digambar untuk situs ini. Huruf: Archivo dan Source Sans 3 (lisensi OFL).</p>
      <h3>Catatan budaya</h3>
      <p>Motif tenun Kaili adalah warisan bersama masyarakat Kaili. Motif itu bukan milik PICO. Setiap pola kabupaten adalah tafsiran dari deskripsi tertulis. Tidak ada yang merupakan reproduksi asli, dan tidak ada foto kain asli yang dipakai.</p>
      <ul class="list-disc">
        <li>Motif bersumber (tafsiran): Donggala, yaitu Buya Subi (bidang belah ketupat dan sulur berbunga) dan kotak Buya Bomba; Kota Palu, yaitu bomba sulur dan bunga sederhana dari Batik Bomba; Poso, yaitu tumpal kain kulit kayu dan belah ketupat dalam cokelat dan krem alami.</li>
        <li>Bergaya, bukan tradisional: Banggai, Morowali, Parigi Moutong, Sigi, Tolitoli, Morowali Utara, Tojo Una-Una, Buol, Banggai Kepulauan dan Banggai Laut memakai struktur tenun polos orisinal.</li>
        <li>Tidak dipakai: Taiganja dan Sambulugana, karena keduanya benda adat Kaili yang sakral; petunjuk kain ritual fuya putih; Buya Sabe dalam konteks pemakaman; batik terdaftar milik Parigi Moutong (Saga), Buol dan Morowali (Ikzara, Tobungku).</li>
      </ul>
      <p>Sumber yang dibaca dan dipakai untuk menggambar:</p>
      <ul class="list-disc"><li v-for="[href, label] in sources" :key="href"><a :href="href" rel="noopener">{{ label }}</a></li></ul>
      <p>Sumber yang dibaca untuk memutuskan apa yang tidak ditiru:</p>
      <ul class="list-disc"><li v-for="[href, label] in avoided" :key="href"><a :href="href" rel="noopener">{{ label }}</a></li></ul>
      <p>Tinjauan budaya oleh pihak yang berwenang belum selesai. <ReviewTodo id="metodologi-budaya" note="cultural review (bead pico-jlc.8) by Dinas Kebudayaan Sulteng or Dekranasda is pending; the owner decides what this line says after it closes" /></p>
    </section>
  </ProseLayout>
</template>

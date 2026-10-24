<script setup lang="ts">
import PicoIcon from '@/components/PicoIcon.vue'
import IsomanCategories from './IsomanCategories.vue'
import IsomanCtas from './IsomanCtas.vue'
import type { Category } from './IsomanCategories.vue'
import type { Cta } from './IsomanCtas.vue'

// Panduan Isolasi Mandiri, urutan halaman lama (Pages/Isolation/Index.vue): empat kartu, anjuran tempat perawatan, panduan di rumah, kontak erat, kapan bebas, PCR ulang. Tanda bahaya di atas adalah tambahan baru.
const ctas: Cta[] = [
  { key: 'tele', href: '#telemedicine', title: 'Konsultasi dengan Dokter', label: 'Tanyakan Sekarang', text: 'Bagi warga yang membutuhkan obat atau konsultasi, yuk konsultasikan terlebih dahulu dengan dokter melalui layanan telekonsultasi dokter.', art: 'telekonsultasi' },
  { key: 'survey', title: 'Pendataan Pasien Isoman', label: 'Isi Sekarang', text: 'Pendataan pasien isoman dan kebutuhan selama isoman untuk membantu tim relawan dalam mendistribusikan bantuan kebutuhan pokok untuk pasien isolasi mandiri.', art: 'isolasi-mandiri', inactive: 'Layanan ini tidak aktif lagi: pendataan oleh tim relawan sudah berakhir dan formulir lama tidak dipakai lagi.' },
  { key: 'faq', href: 'https://bit.ly/faqisoman', title: 'Pertanyaan Seputar Isoman', label: 'Lihat', text: 'Kumpulan tanya jawab dari teman-teman dokter dan nakes seputar Isoman dan COVID-19.', image: '/media/faq.webp', external: true },
  { key: 'donasi', href: '#donasi', title: 'Donasi Untuk Pasien Isoman', label: 'Donasi Sekarang', text: 'Kumpulan donasi yang diinisiasi oleh teman-teman baik untuk membantu warga yang sedang melakukan isolasi mandiri.', art: 'bantuan-antar' },
]
const categories: Category[] = [
  { name: 'Tanpa Gejala', signs: ['Frekuensi napas : 12-20 kali/menit', 'Saturasi ≥ 95%'], places: ['Isoman di rumah', 'Fasilitas isolasi pemerintah'] },
  { name: 'Ringan', signs: ['Demam, batuk, sakit kepala, mual, kehilangan indera penciuman dan pengecapan', 'Frekuensi napas : 12-20 kali/menit', 'Saturasi ≥ 95%'], places: ['Fasilitas isolasi pemerintah', 'Isolasi di rumah bagi yang memenuhi syarat'] },
  { name: 'Sedang', signs: ['Hampir sama dengan gejala pasien ringan', 'namun dengan: Frekuensi napas : 20-30 kali/menit', 'Saturasi < 95%', 'Sesak napas tanpa distress pernapasan'], places: ['RS Darurat Covid-19', 'RS Non Rujukan', 'RS Rujukan'] },
  { name: 'Berat-Kritis', signs: ['Hampir sama dengan gejala pasien sedang', 'namun dengan: Frekuensi napas : > 30 kali/menit', 'Saturasi < 95%', 'Sesak napas dengan distress pernapasan', 'Kondisi kritis: gagal napas, syok sepsis, dan multiorgan failure'], places: ['HCU/ICU RS Rujukan'] },
]
</script>

<template>
  <div class="flex flex-col gap-8 [&_li]:mt-2 [&_p]:mt-3">
    <section aria-labelledby="tanda-bahaya" class="rounded-md border-2 border-indigo bg-tint p-4">
      <h2 id="tanda-bahaya" class="flex items-center gap-2"><PicoIcon name="info" :size="24" class="flex-none text-indigo" /> Tanda bahaya: segera ke fasilitas kesehatan</h2>
      <ul class="list-disc pl-5">
        <li>Sesak napas atau sulit bernapas.</li>
        <li>Nyeri dada.</li>
        <li>Bingung, atau tidak bisa bicara atau bergerak seperti biasa.</li>
        <li>Napas lebih dari 20 kali per menit. Pada gejala ringan, napas 12 sampai 20 kali per menit.</li>
        <li>Saturasi oksigen di bawah 95%, bila Anda punya oximeter. Pada gejala ringan, saturasi di atas 95%.</li>
        <li>Gejala bertambah berat.</li>
      </ul>
      <p class="font-strong">Segera hubungi puskesmas, fasilitas kesehatan terdekat atau petugas pemantau bila ada tanda ini.</p>
      <p class="font-strong">Hubungi 119 atau segera ke instalasi gawat darurat (IGD) rumah sakit bila ada sesak napas berat, nyeri dada, bingung, napas lebih dari 30 kali per menit, atau saturasi oksigen di bawah 93%. Kementerian Kesehatan menggolongkan napas lebih dari 30 kali per menit atau saturasi di bawah 93% sebagai gejala berat.</p>
      <p>Panduan ini untuk orang dewasa. Untuk anak, ibu hamil, atau bila Anda punya penyakit penyerta, tanyakan ke tenaga kesehatan.</p>
    </section>

    <section aria-labelledby="info-isoman">
      <h2 id="info-isoman" class="m-0 text-xl font-bold">Informasi Isolasi Mandiri</h2>
      <IsomanCtas class="mt-4" :items="ctas" />
    </section>

    <section aria-labelledby="perawatan" class="rounded-lg bg-card p-4 shadow-lg" data-testid="isoman-perawatan">
      <h2 id="perawatan" class="m-0 text-lg font-bold">Perawatan Bagi Pasien COVID-19</h2>
      <p>Seiring dengan meningkatnya kasus Covid-19 di Sulawesi Tengah, diperlukan adanya informasi mengenai angka keterisian tempat tidur <i>(Bed Occupancy Rate/BOR)</i> Rumah Sakit untuk memudahkan pendistribusian perawatan pasien Covid-19. Selain itu, diperlukan juga informasi pedoman melakukan Isolasi Mandiri bagi masyarakat untuk membantu masyarakat yang sedang melakukan Isoman. Berikut adalah anjuran perawatan pasien Covid-19 di Sulawesi Tengah yang dikategorikan berdasarkan gejala yang dialami oleh pasien Covid-19.</p>
      <p class="text-center font-bold">Anjuran tempat perawatan pasien Covid-19 berdasarkan gejalanya</p>
      <IsomanCategories class="mt-4" :items="categories" signs-label="Gejala" places-label="Tempat Perawatan" />
      <p class="mt-2 text-right text-sm text-ink-muted">Sumber : Kementrian Kesehatan RI</p>
    </section>

    <section aria-labelledby="rumah" class="rounded-lg bg-card p-4 shadow-lg" data-testid="isoman-rumah">
      <h2 id="rumah" class="m-0 text-lg font-bold">Panduan Isolasi di Rumah</h2>
      <p>Hal pertama yang perlu anda lakukan ketika mengetahui terkonfirmasi positif adalah dengan <b>melaporkan diri ke puskesmas/fasilitas pelayanan kesehatan (fasyankes)</b> terdekat untuk pemantauan kesehatan. Tak hanya untuk mendapatkan pemeriksaan dini oleh tenaga medis, pelaporan ini juga diperlukan untuk proses pelacakan kontak erat.</p>
      <p>Pasien dengan hasil tes positif Covid-19 tidak bisa memutuskan langsung untuk isolasi mandiri <b>tanpa berkonsultasi dengan dokter</b>. Dokter berkompeten memutuskan apakah pasien cukup isoman di rumah, di fasilitas isolasi terpusat, atau perlu dirawat di RS. Konsultasi dokter penting agar pengobatan yang diberikan sesuai kondisi, dan mengantisipasi perburukan saat isoman.</p>
      <p>Ketika anda terkonfirmasi tanpa gejala atau dengan gejala ringan, maka yang perlu anda lakukan adalah melakukan isolasi mandiri. <b>Apa yang perlu anda siapkan untuk isoman?</b></p>
      <ol class="list-decimal pl-6">
        <li>Tetap tinggal di rumah, kecuali untuk kepentingan medis.</li>
        <li>Selain membekali dengan obat dan vitamin, ada baiknya miliki nomor kontak dokter untuk konsultasi &amp; pemantauan kondisi pasien.</li>
        <li>Lengkapi diri dengan alat kesehatan seperti: termometer, oximeter, alat kesehatan lain yang disesuaikan dengan komorbid (mis. pengukur tensi darah)</li>
        <li>Kabarkan keluarga, komunitas, dan teman jika terdiagnosis positif Covid-19 dan harus menjalani isoman.</li>
        <li>Gunakan kamar tidur terpisah dengan anggota keluarga lainnya, dan jika memungkinkan dengan kamar mandi terpisah.</li>
        <li>Terapkan protokol kesehatan (gunakan masker, mencuci tangan, menjaga jarak)</li>
        <li>Lakukan pengukuran suhu harian dan observasi gejala klinis seperti batuk atau kesulitan bernapas.</li>
        <li>Hindari pemakaian bersama peralatan makan, mandi, dan linen/sprei.</li>
        <li>Tidak disarankan menggunakan AC.</li>
        <li>Terapkan Perilaku Hidup Bersih dan Sehat (PHBS): konsumsi makanan bergizi, mencuci tangan dengan sabun dan air mengalir, dan lakukan etika batuk/bersin.</li>
        <li>Berjemur di bawah sinar matahari setiap pagi.</li>
        <li>Jaga kebersihan rumah dengan disinfektan.</li>
        <li>Siapkan tas berisi kebutuhan darurat jika tiba-tiba harus pergi ke fasyankes terdekat, seperti: KTP, kartu BPJS, kartu berobat di fasyankes/RS langganan, baju ganti, peralatan lain seperti gadget, dll.</li>
        <li>Segera hubungi fasyankes terdekat jika terjadi perburukan gejala untuk perawatan lebih lanjut.</li>
      </ol>
      <p class="mt-2 text-right text-sm text-ink-muted">Sumber : Kementrian Kesehatan RI &amp; KawalCovid19</p>
    </section>

    <section aria-labelledby="kontak-erat" class="rounded-lg bg-card p-4 shadow-lg" data-testid="isoman-kontak-erat">
      <h2 id="kontak-erat" class="m-0 text-lg font-bold">Kontak Erat dari Pasien COVID-19</h2>
      <p>Semua yang pernah berhubungan dengan pasien Covid-19 dalam kurun waktu <b>48 jam sebelum tes Covid-19 dilaksanakan</b>, termasuk kontak erat. Pelacakan kontak erat meliputi upaya identifikasi orang yang mungkin terpapar Covid-19 dan pemantauan harian atas kontak erat setiap hari selama 14 hari. Kontak erat disarankan melakukan tes PCR Covid-19 <b>minimal 3 hari setelah kontak erat dengan pasien Covid-19, atau minimal 5 hari setelah kontak dengan pasien untuk tes swab antigen</b>.</p>
      <p>Jika hasil tes PCR/Antigen negatif, anggota keluarga tetap wajib melakukan karantina di ruangan berbeda selama 14 hari untuk mengantisipasi munculnya gejala. <b>Prosedur karantina kontak erat serupa dengan isolasi mandiri pasien Covid-19, namun tidak perlu minum obat</b>.</p>
      <p class="mt-2 text-right text-sm text-ink-muted">Sumber : WHO &amp; KawalCovid19</p>
    </section>

    <section aria-labelledby="bebas" class="rounded-lg bg-card p-4 shadow-lg" data-testid="isoman-bebas">
      <h2 id="bebas" class="m-0 text-lg font-bold">Kapan Pasien COVID-19 Dinyatakan Bebas Isoman?</h2>
      <p>Isolasi mandiri dilakukan selama <b>±10 hari</b> atau hingga pasien memenuhi kriteria sembuh Covid-19. Pasien Covid-19 ringan atau bergejala sedang perlu melakukan isoman selama 10 hari ditambah 3 hari setelah gejala hilang, lalu bebas pada hari ke-14. Namun, jika pada masa isoman muncul gejala, maka waktu isolasi <b>perlu ditambah 10 hari lagi sejak hari pertama gejala muncul</b>, bukan dihitung sejak pertama kali dikonfirmasi positif Covid-19.</p>
      <p class="mt-2 text-right text-sm text-ink-muted">Sumber : Kementrian Kesehatan RI &amp; KawalCovid19</p>
    </section>

    <section aria-labelledby="pcr-ulang" class="rounded-lg bg-card p-4 shadow-lg" data-testid="isoman-pcr-ulang">
      <h2 id="pcr-ulang" class="m-0 text-lg font-bold">Jika Isoman Sudah Selesai, Haruskah Tes PCR Ulang?</h2>
      <p>Kementerian Kesehatan telah menyatakan bahwa tidak ada keharusan melakukan tes PCR ulang bagi pasien Covid-19 ringan-sedang yang <b>telah menyelesaikan isoman</b>.</p>
      <p>Pasien Covid-19 tidak perlu bergantung pada nilai CT yang tertera pada hasil tes. Hasil CT juga bukan satu-satunya acuan seseorang bebas dari masa isoman ataupun pengetesan ulang. Hanya dokter yang <b>memiliki wewenang dan dapat memastikan status kesehatan pasien</b> serta menentukan perlu tidaknya tes PCR ulang.</p>
      <p>Isolasi di rumah bagi pasien tanpa gejala maupun yang bergejala ringan, bisa menjadi hal yang berat bagi sebagian orang. Namun, cara ini efektif untuk melindungi anda, keluarga, serta orang lain dari penularan Covid-19.</p>
      <p class="mt-2 text-right text-sm text-ink-muted">Sumber : Kementrian Kesehatan RI &amp; KawalCovid19</p>
    </section>

    <p class="m-0 text-sm text-ink-muted">Panduan di bawah disalin dari halaman lama (2021) dan bisa sudah berubah. Isinya belum ditinjau tenaga medis dan bukan pengganti nasihat dokter.</p>
  </div>
</template>

<script setup lang="ts">
import PicoIcon from '@/components/PicoIcon.vue'

// Indonesian guide (spec 73). Ported from the 2021 page and cut down to the steps and signs below; see the task Outcome for what was dropped.
</script>

<template>
  <div class="flex max-w-prose flex-col gap-12 [&_h2]:text-xl [&_li]:mt-2 [&_ol]:mt-3 [&_ol]:pl-4 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:pl-4">
    <section aria-labelledby="tanda-bahaya" class="rounded-md border-2 border-indigo bg-tint p-4">
      <h2 id="tanda-bahaya" class="flex items-center gap-2"><PicoIcon name="info" :size="24" class="flex-none text-indigo" /> Tanda bahaya: segera ke fasilitas kesehatan</h2>
      <ul>
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

    <section aria-labelledby="langkah-pertama">
      <h2 id="langkah-pertama">Langkah pertama</h2>
      <p>Bila Anda bergejala atau dinyatakan positif, segera konsultasi lewat telemedisin atau puskesmas setempat. Pemantauan dilakukan oleh tenaga kesehatan.</p>
      <p>Isolasi dapat dilakukan mandiri di rumah atau di fasilitas isolasi terpusat. Rumah sakit diprioritaskan untuk pasien bergejala sedang, berat atau kritis, dan yang membutuhkan oksigen.</p>
    </section>

    <section aria-labelledby="persiapan">
      <h2 id="persiapan">Yang perlu disiapkan</h2>
      <ol class="list-decimal">
        <li>Siapkan termometer dan oximeter.</li>
        <li>Simpan nomor petugas pemantau atau puskesmas, untuk melapor bila keadaan memburuk.</li>
        <li>Pakai kamar tidur sendiri bila bisa.</li>
        <li>Pakai alat makan dan alat mandi sendiri.</li>
        <li>Bila punya penyakit penyerta, lanjutkan obat rutin sesuai anjuran dokter.</li>
      </ol>
    </section>

    <section aria-labelledby="perawatan-harian">
      <h2 id="perawatan-harian">Perawatan harian</h2>
      <ul class="list-disc">
        <li>Ukur dan catat suhu badan dan saturasi oksigen dua kali sehari, pagi dan malam.</li>
        <li>Beri tahu petugas pemantau atau puskesmas bila suhu badan di atas 38&nbsp;°C.</li>
        <li>Pakai masker bila keluar kamar dan saat bertemu anggota keluarga. Jaga jarak dan tutup mulut saat batuk atau bersin.</li>
        <li>Cuci tangan sesering mungkin dengan sabun dan air mengalir, atau dengan <i>hand sanitizer</i>.</li>
        <li>Cuci alat makan dan minum segera dengan air dan sabun.</li>
        <li>Buka jendela kamar secara berkala dan bersihkan kamar setiap hari.</li>
      </ul>
    </section>

    <p class="m-0 text-sm text-ink-muted">Disusun ulang oleh PICO Sulteng dari sumber publik berikut, per 24 Oktober 2026. Isinya belum ditinjau tenaga medis dan bukan pengganti nasihat dokter. Sumber: <a href="https://infeksiemerging.kemkes.go.id/document/download/mvE" rel="noopener">Keputusan Menteri Kesehatan HK.01.07/MENKES/5671/2021</a> (19 Agustus 2021); <a href="https://kemkes.go.id/id/pasien-positif-covid-19-tanpa-gejala-cukup-isoman" rel="noopener">Kementerian Kesehatan, 4 Februari 2022</a>; <a href="https://www.who.int/news-room/questions-and-answers/item/coronavirus-disease-covid-19-home-care-for-families-and-caregivers" rel="noopener">WHO, perawatan di rumah</a> (12 April 2022); <a href="https://kemkes.go.id/id/akses-darurat-medis-119-kini-bisa-melalui-satusehat-mobile" rel="noopener">Kementerian Kesehatan, layanan darurat medis 119</a> (5 Oktober 2024).</p>
  </div>
</template>

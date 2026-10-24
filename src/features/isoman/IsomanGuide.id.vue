<script setup lang="ts">
import PicoIcon from '@/components/PicoIcon.vue'
import ReviewTodo from '@/components/ReviewTodo.vue'

// Indonesian guide (spec 73). Ported from the 2021 page and cut down to the steps and signs below; see the task Outcome for what was dropped.
</script>

<template>
  <div class="flex max-w-prose flex-col gap-8 [&_h2]:text-xl [&_li]:mt-3 [&_ol]:mt-4 [&_ol]:pl-5 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:pl-5">
    <section aria-labelledby="tanda-bahaya" class="rounded-md border-2 border-indigo bg-tint p-5">
      <h2 id="tanda-bahaya" class="flex items-center gap-3"><PicoIcon name="info" :size="24" class="flex-none text-indigo" /> Tanda bahaya: segera ke fasilitas kesehatan</h2>
      <ul>
        <li>Sesak napas atau napas terasa berat.</li>
        <li>Napas cepat, lebih dari 20 kali per menit.</li>
        <li>Saturasi oksigen di bawah 95%, bila Anda punya oximeter.</li>
        <li>Gejala bertambah berat.</li>
      </ul>
      <p class="font-strong">Segera hubungi fasilitas kesehatan terdekat bila ada tanda ini.</p>
      <p><ReviewTodo id="isoman-danger-signs" note="the limits come from the 2021 Ministry of Health table on the old page; a medical reviewer must confirm them before launch (O-5a)" /></p>
    </section>

    <section aria-labelledby="langkah-pertama">
      <h2 id="langkah-pertama">Langkah pertama</h2>
      <p>Bila Anda dinyatakan positif, laporkan diri ke puskesmas atau fasilitas pelayanan kesehatan terdekat untuk pemantauan. Laporan ini juga membantu pelacakan kontak erat.</p>
      <p>Konsultasikan dengan dokter sebelum memutuskan isolasi mandiri. Dokter yang menentukan apakah Anda cukup isolasi di rumah, di fasilitas isolasi, atau perlu dirawat di rumah sakit.</p>
    </section>

    <section aria-labelledby="persiapan">
      <h2 id="persiapan">Yang perlu disiapkan</h2>
      <ol class="list-decimal">
        <li>Tetap tinggal di rumah, kecuali untuk kepentingan medis.</li>
        <li>Simpan nomor kontak dokter untuk konsultasi dan pemantauan.</li>
        <li>Siapkan alat kesehatan seperti termometer dan oximeter, serta alat lain sesuai penyakit penyerta, misalnya alat ukur tekanan darah.</li>
        <li>Kabarkan keluarga, komunitas dan teman bahwa Anda menjalani isolasi mandiri.</li>
        <li>Pakai kamar tidur terpisah, dan kamar mandi terpisah bila mungkin.</li>
        <li>Siapkan tas berisi keperluan darurat bila sewaktu-waktu harus ke fasilitas kesehatan: KTP, kartu BPJS, kartu berobat, baju ganti.</li>
      </ol>
    </section>

    <section aria-labelledby="perawatan-harian">
      <h2 id="perawatan-harian">Perawatan harian</h2>
      <ul class="list-disc">
        <li>Ukur suhu badan setiap hari dan amati gejala seperti batuk atau sulit bernapas.</li>
        <li>Pakai masker, cuci tangan dan jaga jarak dengan orang serumah.</li>
        <li>Jangan berbagi alat makan, alat mandi, dan sprei.</li>
        <li>Makan makanan bergizi, cuci tangan dengan sabun dan air mengalir, dan tutup mulut saat batuk atau bersin.</li>
      </ul>
    </section>

    <p class="m-0 text-sm text-ink-muted">Sumber materi asli: Kementerian Kesehatan RI dan KawalCovid19, 2021. Disusun ulang oleh PICO Sulteng. <ReviewTodo id="isoman-review" note="a medical reviewer must read this whole guide before launch (O-5a)" /></p>
  </div>
</template>

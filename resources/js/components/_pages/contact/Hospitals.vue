<template>
  <div class="w-full">
    <div class="p-6 mx-4 mt-8 bg-white rounded-lg shadow-md">
      <h3 class="text-lg font-bold text-left lg:text-3xl">
        Daftar Rumah Sakit Rujukan
      </h3>
      <p class="mt-4 text-sm md:text-base">
        Berikut ini adalah rumah sakit yang menjadi rujukan untuk pasien dengan
        status Pasien dalam Pengawasan. Anda harus mengunjungi fasilitas
        kesehatan terdekat terlebih dahulu seperti klinik/rumah sakit umum
        sebelum akhirnya dapat dirujuk ke rumah sakit di bawah ini.
      </p>
      <content-loader v-if="hospitals.length <= 0"></content-loader>
      <div
        v-else
        class="grid grid-cols-1 gap-5 mt-8 md:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="hospital in hospitals"
          :key="hospital.id"
          class="flex flex-col flex-wrap w-full p-4 border-l-2 border-r-2 border-blue-400 rounded-lg "
        >
          <h4 class="font-bold text-left">
            {{ hospital.name }}
            <span v-if="hospital.igd_count > 0" class="font-normal">
              (<b>{{ hospital.igd_count }}</b> IGD tersedia)
            </span>
            <span v-else class="font-normal text-red-600"> (IGD Penuh!) </span>
          </h4>
          <p class="my-2 text-xs text-left">
            <span class="text-gray-500">Pembaruan Terakhir : </span>
            {{ formatDate(hospital.bed_update) }}
          </p>
          <p class="flex-1 my-2 text-xs text-left md:text-sm">
            {{ hospital.address }}
          </p>
          <div class="flex-1 space-y-2">
            <contact-button
              v-for="contact in hospital.contacts"
              :key="contact.id"
              :contact="contact"
              margin-right="mr-2"
              class="flex-none"
            />
          </div>
          <hr class="my-2" />
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <a
              :href="
                'https://maps.google.com/maps?q=' +
                hospital.latitude +
                ',' +
                hospital.longitude
              "
              target="_blank"
              class="w-full p-2 mx-auto text-sm text-center text-white bg-gray-700 rounded-md  hover:opacity-75 xl:text-base"
            >
              <i class="fas fa-map"></i> Lihat di Peta
            </a>
            <a
              :href="checkBed(hospital.hospital_code)"
              target="_blank"
              class="w-full p-2 mx-auto text-sm text-center text-white bg-pink-700 rounded-md  hover:opacity-75 xl:text-base"
            >
              <i class="fas fa-procedures"></i> Lihat Tempat Tidur
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ContentLoader } from "vue-content-loader";
import ContactButton from "@/components/ContactButton";
export default {
  props: {
    hospitals: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  methods: {
    checkBed(hospitalCode) {
      return `https://yankes.kemkes.go.id/app/siranap/tempat_tidur?kode_rs=${hospitalCode}&jenis=1&propinsi=72prop`;
    },
  },
  components: {
    ContentLoader,
    ContactButton,
  },
};
</script>
<template>
  <div class="w-full p-4 text-gray-800 bg-white rounded-lg shadow-lg">
    <h4 class="mb-2 text-sm font-semibold md:text-2xl">
      {{ title }}
    </h4>
    <p :class="textColor" class="font-semibold">
      {{ new_vaccinated }}
      <span class="text-sm">
        ( <i class="text-xs fas" :class="icon(this.growthRate)"></i>
        {{ growth }} )</span
      >
    </p>
    <p
      class="my-4 text-5xl font-semibold text-center md:text-8xl"
      :class="textColor"
    >
      {{ total_vaccinated }}
    </p>
    <p class="text-xs text-right text-gray-500 md:text-base">
      Dosis telah diberikan
    </p>
    <div class="flex flex-row justify-between my-4">
      <div class="flex flex-row w-5/6 h-8 bg-gray-200 rounded-md">
        <div
          class="h-full rounded-md"
          :class="progressColor"
          :style="progress(total, target)"
        ></div>
      </div>
      <p
        class="w-1/6 mx-auto my-auto text-xs font-semibold text-center  md:text-xl lg:text-2xl"
        :class="textColor"
      >
        {{ percentage(total, target) }}
      </p>
    </div>
    <p class="text-xs text-gray-500 md:text-base">
      <b class="text-gray-800">{{ percentage(total, target) }}</b> dari
      <b class="text-gray-800">{{ target_vaccinated }}</b> telah divaksin
    </p>
  </div>
</template>
<script>
const NumberFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});
export default {
  props: {
    textColor: {
      type: String,
      default: "text-green-700",
    },
    progressColor: {
      type: String,
      default: "bg-green-500",
    },
    title: {
      type: String,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    addition: {
      type: Number,
      required: true,
    },
    growthRate: {
      type: Number,
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
  },
  computed: {
    target_vaccinated() {
      return NumberFormat.format(this.target);
    },
    total_vaccinated() {
      return NumberFormat.format(this.total);
    },
    new_vaccinated() {
      let prefix = this.addition >= 0 ? "+" : "";
      return `${prefix}${NumberFormat.format(this.addition)}`;
    },
    growth() {
      return `${NumberFormat.format(Math.abs(this.growthRate))} %`;
    },
  },
  methods: {
    progress(value, total) {
      return `width: ${Math.min(100, (value / total) * 100)}%`;
    },
    percentage(value, total) {
      return `${NumberFormat.format(Math.min(100, (value / total) * 100))} %`;
    },
    icon(value) {
      if (value === 0) {
        return "";
      }
      return value > 0 ? "fa-angle-double-up" : "fa-angle-double-down";
    },
  },
};
</script>
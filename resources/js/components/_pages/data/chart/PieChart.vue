<template>
  <div class="w-full p-3">
    <!--Graph Card-->
    <div class="bg-white rounded-lg shadow-lg vld-parent">
      <div class="flex justify-center w-full">
        <loading
          :active="isLoading()"
          :is-full-page="false"
          :opacity="0.8"
          :width="120"
          :height="400"
          color="#59F"
        >
        </loading>
      </div>
      <div v-show="!isLoading()" style="height: 400px" class="p-5">
        <keep-alive>
          <canvas
            id="pie-chart"
            aria-label="Pie Chart Konfirmasi COVID-19"
            role="img"
          ></canvas>
        </keep-alive>
      </div>
    </div>
    <!--/Graph Card-->
  </div>
</template>
<script>
import Loading from "vue-loading-overlay";
import "vue-loading-overlay/dist/vue-loading.css";
import ChartDataLabels from "chartjs-plugin-datalabels";
import Chart from "chart.js/auto";
Chart.register({ ChartDataLabels });
import { id } from "date-fns/locale";
const { format } = require("date-fns");
var dataChart = {
  type: "pie",
  data: {
    labels: ["Dirawat", "Sembuh", "Meninggal"],
    datasets: [
      {
        data: [],
        backgroundColor: [
          "rgb(54, 162, 235)",
          "rgb(75, 192, 192)",
          "rgb(255, 159, 64)",
        ],
      },
    ],
  },
  options: {
    locale: "id-ID",
    plugins: {
      title: {
        display: true,
        fontSize: 16,
        text: "Persentase Kasus Positif COVID-19 di Sulawesi Tengah",
      },
      datalabels: {
        formatter: (value, ctx) => {
          let sum = 0;
          let dataArr = ctx.chart.data.datasets[0].data;
          dataArr.map((data) => {
            sum += data;
          });
          let percentage = ((value * 100) / sum).toFixed(2) + "%";
          return percentage;
        },
        color: "#fff",
      },
      legend: { position: "bottom", usePointStyle: false, display: true },
    },
    maintainAspectRatio: false,
    responsive: true,
  },
};
export default {
  components: {
    Loading,
  },
  props: {
    propsDataProvinsi: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      chart: null,
      jsonDataProvinsi: {},
    };
  },
  methods: {
    isLoading() {
      return _.isEmpty(this.jsonDataProvinsi) ? true : false;
    },
    createChart(chartId, chartData) {
      const ctx = document.getElementById(chartId);
      if (this.chart != null) {
        this.chart.destroy();
      }
      this.chart = new Chart(ctx, {
        type: chartData.type,
        data: chartData.data,
        options: chartData.options,
      });
    },
    getStatistic: function () {
      let data = this.jsonDataProvinsi;
      let positif = data == undefined ? 0 : data.kumulatif.positif;
      let sembuh = data == undefined ? 0 : data.kumulatif.sembuh;
      let meninggal = data == undefined ? 0 : data.kumulatif.meninggal;
      let dirawat = positif - (sembuh + meninggal);
      dataChart.data.datasets[0].data = [dirawat, sembuh, meninggal];
      this.chart.update();
      this.chart.render();
    },
  },
  watch: {
    propsDataProvinsi() {
      this.jsonDataProvinsi = this.propsDataProvinsi;
      this.getStatistic();
    },
  },
  mounted() {
    this.jsonDataProvinsi = this.propsDataProvinsi;
    this.createChart("pie-chart", dataChart);
    this.getStatistic();
  },
};
</script>
<template>
  <div>
    <h3 class="font-piratesbay text-2xl text-center">Recent Game Counts</h3>
    <Line id="games-over-time" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { Game } from "@prisma/client";
import { Line } from "vue-chartjs";
import dayjs from "dayjs";

const props = defineProps<{
  games: Game[];
}>();

// Get past six months
const months = Array.from(Array(6).keys())
  .map((i) => dayjs().subtract(i, "month").format("MMMM"))
  .reverse();

const data: { [key: string]: number } = {};

for (const game of props.games) {
  const month = dayjs(game.date).format("MMMM");
  if (data[month]) {
    data[month] += 1;
  } else {
    data[month] = 1;
  }
}

const chartData = computed(() => ({
  labels: months,
  datasets: [
    {
      data: months.map((month) => data[month] ?? 0),
      // backgroundColor: "blue",
      tension: 0.1,
      borderColor: "rgb(75, 192, 192)",
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      stacked: true,
      ticks: {
        min: 0,
        stepSize: 1,
        max: 4,
      },
    },
    y: {
      stacked: true,
      ticks: {
        min: 0,
        stepSize: 1,
        max: 4,
      },
    },
  },
}));
</script>

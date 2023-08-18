<template>
  <div>
    <h3 class="font-dumbledor text-2xl text-center">Games Over Time</h3>
    <Line id="games-over-time" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { Game } from "@prisma/client";
import { Line } from "vue-chartjs";
import dayjs from "dayjs";

const { Script } = useScripts();
const props = defineProps<{
  games: Game[];
}>();

// Get past six months
const months = Array.from(Array(12).keys())
  .map((i) => dayjs().subtract(i, "month").format("MMMM"))
  .reverse();

const data = computed(() => {
  const data: {
    [key: string]: {
      troubleBrewing: number;
      sectsAndViolets: number;
      badMoonRising: number;
      customScript: number;
    };
  } = {};

  for (const game of props.games.filter((game) => !game.ignore_for_stats)) {
    const month = dayjs(game.date).format("MMMM");
    if (!data[month]) {
      data[month] = {
        troubleBrewing: 0,
        sectsAndViolets: 0,
        badMoonRising: 0,
        customScript: 0,
      };
    }

    if (game.script === Script.TroubleBrewing) data[month].troubleBrewing++;
    else if (game.script === Script.SectsAndViolets)
      data[month].sectsAndViolets++;
    else if (game.script === Script.BadMoonRising) data[month].badMoonRising++;
    else data[month].customScript++;
  }

  return data;
});

const chartData = computed(() => ({
  labels: months,
  datasets: [
    {
      label: "Trouble Brewing",
      data: months.map((month) => data.value[month]?.troubleBrewing ?? 0),
      backgroundColor: "red",
      borderColor: "red",
      tension: 0.1,
    },
    {
      label: "Sects and Violets",
      data: months.map((month) => data.value[month]?.sectsAndViolets ?? 0),
      backgroundColor: "purple",
      borderColor: "purple",
      tension: 0.1,
    },
    {
      label: "Bad Moon Rising",
      data: months.map((month) => data.value[month]?.badMoonRising ?? 0),
      backgroundColor: "yellow",
      borderColor: "yellow",
      tension: 0.1,
    },
    {
      label: "Custom Script",
      data: months.map((month) => data.value[month]?.customScript ?? 0),
      backgroundColor: "green",
      borderColor: "green",
      tension: 0.1,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  // plugins: {
  //   legend: {
  //     display: false,
  //   },
  // },
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

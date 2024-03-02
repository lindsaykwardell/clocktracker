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

const months = Array.from(Array(12).keys())
  .map((i) => dayjs().subtract(i, "month").format("MMMM"))
  .reverse();

const validMonths = Array.from(Array(12).keys()).map((i) =>
  dayjs().subtract(i, "month").format("YYYY MMMM")
);

const colors = {
  tb: "#A00A23",
  bmr: "#F4C43C",
  snv: "#944CAC",
  custom: "#008000",
}

const data = computed(() => {
  const data: {
    [key: string]: {
      troubleBrewing: number;
      sectsAndViolets: number;
      badMoonRising: number;
      customScript: number;
    };
  } = {};

  for (const game of props.games.filter(
    (game) =>
      !game.ignore_for_stats &&
      validMonths.includes(dayjs(game.date).format("YYYY MMMM"))
  )) {
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
      backgroundColor: colors.tb,
      borderColor: colors.tb,
      tension: 0.1,
    },
    {
      label: "Sects and Violets",
      data: months.map((month) => data.value[month]?.sectsAndViolets ?? 0),
      backgroundColor: colors.snv,
      borderColor: colors.snv,
      tension: 0.1,
    },
    {
      label: "Bad Moon Rising",
      data: months.map((month) => data.value[month]?.badMoonRising ?? 0),
      backgroundColor: colors.bmr,
      borderColor: colors.bmr,
      tension: 0.1,
    },
    {
      label: "Custom Script",
      data: months.map((month) => data.value[month]?.customScript ?? 0),
      backgroundColor: colors.custom,
      borderColor: colors.custom,
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
      // stacked: true,
      ticks: {
        min: 0,
        stepSize: 1,
        max: 4,
      },
    },
  },
}));
</script>

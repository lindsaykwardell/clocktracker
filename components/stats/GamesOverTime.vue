<template>
  <div class="w-100">
    <h3 class="font-sorts text-2xl text-center mb-4">
      Games Over Time
    </h3>
    <Line 
      id="games-over-time" 
      :data="chartData" 
      :options="chartOptions" 
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Line } from "vue-chartjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { GameRecord } from "~/composables/useGames";
import { chartColors } from "~/composables/useChartColors";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Script } = useScripts();

const props = defineProps<{
  games: GameRecord[];
}>();

const months = Array.from(Array(12).keys())
  .map((i) => dayjs().subtract(i, "month").format("MMMM"))
  .reverse();

const validMonths = Array.from(Array(12).keys()).map((i) =>
  dayjs().subtract(i, "month").format("YYYY MMMM")
);

const data = computed(() => {
  const data: {
    [key: string]: {
      troubleBrewing: number;
      sectsAndViolets: number;
      badMoonRising: number;
      customScript: number;
      unknownScript: number;
    };
  } = {};

  for (const game of props.games.filter(
    (game) =>
      !game.ignore_for_stats &&
      validMonths.includes(dayjs(game.date).format("YYYY MMMM"))
  )) {
    const month = dayjs(game.date).tz("UTC").format("MMMM");
    if (!data[month]) {
      data[month] = {
        troubleBrewing: 0,
        sectsAndViolets: 0,
        badMoonRising: 0,
        customScript: 0,
        unknownScript: 0,
      };
    }

    const script = game.script as string | null;

    if (!script) {
      data[month].unknownScript++;
    } 
    else if (script === Script.TroubleBrewing) {
      data[month].troubleBrewing++;
    } 
    else if (script === Script.SectsAndViolets) {
      data[month].sectsAndViolets++;
    } 
    else if (script === Script.BadMoonRising) {
      data[month].badMoonRising++;
    } 
    else {
      data[month].customScript++;
    }
  }

  return data;
});

const chartData = computed(() => ({
  labels: months,
  datasets: [
    {
      // Put unknown at the bottom of the chart since its probably rare.
      label: "Unknown", 
      data: months.map((month) => data.value[month]?.unknownScript ?? 0),
      backgroundColor: chartColors.unknown,
      borderColor: chartColors.unknown,
      tension: 0.1,
      fill: true,
    },
    {
      label: "Trouble Brewing",
      data: months.map((month) => data.value[month]?.troubleBrewing ?? 0),
      backgroundColor: chartColors.tb,
      borderColor: chartColors.tb,
      tension: 0.1,
      fill: true,
    },
    {
      label: "Sects & Violets",
      data: months.map((month) => data.value[month]?.sectsAndViolets ?? 0),
      backgroundColor: chartColors.snv,
      borderColor: chartColors.snv,
      tension: 0.1,
      fill: true,
    },
    {
      label: "Bad Moon Rising",
      data: months.map((month) => data.value[month]?.badMoonRising ?? 0),
      backgroundColor: chartColors.bmr,
      borderColor: chartColors.bmr,
      tension: 0.1,
      fill: true,
    },
    {
      label: "Custom",
      data: months.map((month) => data.value[month]?.customScript ?? 0),
      backgroundColor: chartColors.custom,
      borderColor: chartColors.custom,
      tension: 0.1,
      fill: true,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
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

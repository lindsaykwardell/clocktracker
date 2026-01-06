<template>
  <div class="w-full h-64">
    <h2 class="font-sorts text-center text-xl lg:text-2xl mb-1 lg:mb-2">
      Games & Balance
    </h2>

    <div class="text-center text-balance max-w-[80ch] mb-2 lg:mb-4 mx-auto text-stone-800 dark:text-stone-300 space-y-2">
      <p>
        An overview of this community's games and balance evolution (Good vs Evil) in the past 12 months.
      </p>
    </div>

    <Line
      id="community-games-balance-over-time"
      :data="chartData"
      :options="chartOptions"
      :plugins="[lineOnTop]"
      class="mb-16"
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
import { WinStatus_V2 } from "~/composables/useGames";
import { chartColors } from "~/composables/useChartColors";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Script } = useScripts();

const props = defineProps<{
  games: GameRecord[];
}>();

const months = Array.from({ length: 12 }, (_, i) =>
  dayjs().subtract(i, "month")
).reverse();

const monthKeys = months.map((m) => m.format("YYYY-MM"));
const monthLabels = months.map((m) => m.format("MMM YY"));
const validMonths = new Set(monthKeys);

const filteredGames = computed(() =>
  props.games.filter(
    (game) =>
      !game.ignore_for_stats &&
      validMonths.has(dayjs(game.date).tz("UTC").format("YYYY-MM"))
  )
);

const monthlyCounts = computed(() => {
  const counts: Record<
    string,
    {
      troubleBrewing: number;
      sectsAndViolets: number;
      badMoonRising: number;
      customScript: number;
      unknownScript: number;
    }
  > = {};

  for (const key of monthKeys) {
    counts[key] = {
      troubleBrewing: 0,
      sectsAndViolets: 0,
      badMoonRising: 0,
      customScript: 0,
      unknownScript: 0,
    };
  }

  for (const game of filteredGames.value) {
    const key = dayjs(game.date).tz("UTC").format("YYYY-MM");
    const entry = counts[key];
    if (!entry) continue;

    const script = game.script as string | null;

    if (!script) {
      entry.unknownScript++;
    } else if (script === Script.TroubleBrewing) {
      entry.troubleBrewing++;
    } else if (script === Script.SectsAndViolets) {
      entry.sectsAndViolets++;
    } else if (script === Script.BadMoonRising) {
      entry.badMoonRising++;
    } else {
      entry.customScript++;
    }
  }

  return counts;
});

const monthlyOutcomes = computed(() => {
  const outcomes: Record<string, { good: number; evil: number }> = {};
  for (const key of monthKeys) {
    outcomes[key] = { good: 0, evil: 0 };
  }

  for (const game of filteredGames.value) {
    const key = dayjs(game.date).tz("UTC").format("YYYY-MM");
    const entry = outcomes[key];
    if (!entry) continue;

    if (game.win_v2 === WinStatus_V2.GOOD_WINS) entry.good++;
    else if (game.win_v2 === WinStatus_V2.EVIL_WINS) entry.evil++;
  }

  return outcomes;
});

const cumulativeBalance = computed(() => {
  let good = 0;
  let evil = 0;

  return monthKeys.map((key) => {
    const entry = monthlyOutcomes.value[key];
    if (entry) {
      good += entry.good;
      evil += entry.evil;
    }

    const total = good + evil;
    const pct = total ? (good / total) * 100 : 0;

    return { good, evil, total, pct };
  });
});

const chartData = computed(() => ({
  labels: monthLabels,
  datasets: [
    {
      type: "bar",
      label: "Trouble Brewing",
      data: monthKeys.map(
        (key) => monthlyCounts.value[key]?.troubleBrewing ?? 0
      ),
      backgroundColor: chartColors.tb,
      borderColor: chartColors.tb,
      borderWidth: 0,
      stack: "counts",
      yAxisID: "counts",
      order: 1,
      z: 1,
    },
    {
      type: "bar",
      label: "Sects & Violets",
      data: monthKeys.map(
        (key) => monthlyCounts.value[key]?.sectsAndViolets ?? 0
      ),
      backgroundColor: chartColors.snv,
      borderColor: chartColors.snv,
      borderWidth: 0,
      stack: "counts",
      yAxisID: "counts",
      order: 1,
      z: 1,
    },
    {
      type: "bar",
      label: "Bad Moon Rising",
      data: monthKeys.map(
        (key) => monthlyCounts.value[key]?.badMoonRising ?? 0
      ),
      backgroundColor: chartColors.bmr,
      borderColor: chartColors.bmr,
      borderWidth: 0,
      stack: "counts",
      yAxisID: "counts",
      order: 1,
      z: 1,
    },
    {
      type: "bar",
      label: "Custom",
      data: monthKeys.map(
        (key) => monthlyCounts.value[key]?.customScript ?? 0
      ),
      backgroundColor: chartColors.custom,
      borderColor: chartColors.custom,
      borderWidth: 0,
      stack: "counts",
      yAxisID: "counts",
      order: 1,
      z: 1,
    },
    {
      type: "bar",
      label: "Unknown",
      data: monthKeys.map((key) => monthlyCounts.value[key]?.unknownScript ?? 0),
      backgroundColor: chartColors.unknown,
      borderColor: chartColors.unknown,
      borderWidth: 0,
      stack: "counts",
      yAxisID: "counts",
      order: 1,
      z: 1,
    },
    {
      type: "line",
      label: "Game balance (Good wins %)",
      data: cumulativeBalance.value.map((entry) => entry.pct),
      backgroundColor: chartColors.good,
      borderColor: chartColors.good,
      borderWidth: 3,
      tension: 0,
      fill: false,
      pointRadius: 3,
      pointBackgroundColor: chartColors.good,
      yAxisID: "balance",
      order: 99,
      z: 10,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  scales: {
    x: {
      stacked: true,
    },
    counts: {
      stacked: true,
      ticks: {
        stepSize: 1,
      },
      title: {
        display: true,
        text: "Games played",
      },
    },
    balance: {
      position: "right",
      min: 0,
      max: 100,
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        callback: (value: number) => `${value}%`,
      },
      title: {
        display: true,
        text: "Balance (Good win %)",
      },
    },
  },
  datasets: {
    bar: {
      order: 1,
    },
    line: {
      order: 99,
    },
  },
  plugins: {
    legend: {
      display: true,
      position: "bottom",
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          if (ctx.dataset.yAxisID === "balance") {
            const pct = ctx.parsed.y ?? 0;
            return `Balance: ${pct.toFixed(0)}% good wins`;
          }
          return `${ctx.dataset.label}: ${ctx.parsed.y}`;
        },
      },
    },
  },
}));

const lineOnTop = {
  id: "lineOnTop",
  afterDatasetsDraw(chart: any) {
    const index = chart.data.datasets.findIndex(
      (ds: any) => ds.label === "Game balance (Good wins %)"
    );
    if (index === -1) return;
    const meta = chart.getDatasetMeta(index);
    meta.controller.draw();
  },
};
</script>

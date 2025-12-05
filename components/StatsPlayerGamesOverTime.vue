<template>
  <div class="w-full h-64">
    <h2 class="font-sorts text-center text-xl lg:text-2xl mb-1 lg:mb-2">
      Games & Win Rate
    </h2>
    
    <div class="text-center text-balance max-w-[80ch] mb-2 lg:mb-4 mx-auto text-stone-800 dark:text-stone-300 space-y-2">
      <p>
        An overview of {{ props.isMe ? 'your' : `this player's` }} played games and win rate evolution in the past 12 months.
      </p>
    </div>

    <Line
      id="player-games-win-rate-over-time"
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
import { chartColors } from "~/composables/useChartColors";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Script } = useScripts();

const props = defineProps<{
  games: GameRecord[];
  isMe?: boolean;
}>();

const months = Array.from({ length: 12 }, (_, i) =>
  dayjs().subtract(i, "month")
).reverse();

const monthKeys = months.map((m) => m.format("YYYY-MM"));
const monthLabels = months.map((m) => m.format("MMM YY"));
const validMonths = new Set(monthKeys);

const playerGames = computed(() =>
  props.games.filter(
    (game) =>
      !game.ignore_for_stats &&
      !game.is_storyteller &&
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

  for (const game of playerGames.value) {
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

type Alignment = "GOOD" | "EVIL" | null;

function getStatsCharacter(game: GameRecord) {
  if (game.ignore_for_stats) return null;
  if (game.is_storyteller) return null;
  if (!game.player_characters.length) return null;

  const last = game.player_characters.at(-1);
  if (!last || !last.name) return null;
  if (last.role?.type === "FABLED" || last.role?.type === "LORIC") return null;

  return last;
}

const winRates = computed(() => {
  // Track per-month decided games and wins
  const monthly: Record<string, { decided: number; wins: number }> = {};
  for (const key of monthKeys) {
    monthly[key] = { decided: 0, wins: 0 };
  }

  for (const game of playerGames.value) {
    const last = getStatsCharacter(game);
    if (!last) continue;

    const alignment = last.alignment as Alignment;
    if (!alignment) continue;

    const key = dayjs(game.date).tz("UTC").format("YYYY-MM");
    const entry = monthly[key];
    if (!entry) continue;

    const goodWins = game.win_v2 === "GOOD_WINS";
    const evilWins = game.win_v2 === "EVIL_WINS";

    let isWin = false;
    let isLoss = false;

    if (
      (alignment === "GOOD" && goodWins) ||
      (alignment === "EVIL" && evilWins)
    ) {
      isWin = true;
    } else if (
      (alignment === "GOOD" && evilWins) ||
      (alignment === "EVIL" && goodWins)
    ) {
      isLoss = true;
    }

    if (isWin || isLoss) {
      entry.decided++;
      if (isWin) entry.wins++;
    }
  }

  // Build cumulative win rate through time so each month reflects overall performance to-date.
  let totalDecided = 0;
  let totalWins = 0;

  return monthKeys.map((key) => {
    const entry = monthly[key];
    if (entry) {
      totalDecided += entry.decided;
      totalWins += entry.wins;
    }
    if (!totalDecided) return 0;
    return (totalWins / totalDecided) * 100;
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
      label: "Win rate (Cumulative)",
      data: winRates.value,
      backgroundColor: chartColors.win,
      borderColor: chartColors.win,
      borderWidth: 3,
      tension: 0,
      fill: false,
      pointRadius: 3,
      pointBackgroundColor: chartColors.win,
      yAxisID: "winRate",
      // Draw above stacked bars
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
    winRate: {
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
        text: "Win rate",
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
          if (ctx.dataset.yAxisID === "winRate") {
            return `Win rate: ${ctx.parsed.y.toFixed(0)}%`;
          }
          return `${ctx.dataset.label}: ${ctx.parsed.y}`;
        },
      },
    },
  },
}));

// Force the win-rate line to render after bars
const lineOnTop = {
  id: "lineOnTop",
  afterDatasetsDraw(chart: any) {
    const index = chart.data.datasets.findIndex(
      (ds: any) => ds.label === "Win rate (Cumulative)"
    );
    if (index === -1) return;
    const meta = chart.getDatasetMeta(index);
    meta.controller.draw();
  },
};
</script>

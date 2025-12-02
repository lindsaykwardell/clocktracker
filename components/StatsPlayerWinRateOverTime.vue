<template>
  <div class="w-full h-40 md:h-48">
    <Line id="win-rate-over-time" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Line } from "vue-chartjs";
import type { Game, Character } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { chartColors } from "~/composables/useChartColors";

dayjs.extend(utc);
dayjs.extend(timezone);

type Alignment = "GOOD" | "EVIL" | null;

type GameWithChars = Game & {
  ignore_for_stats?: boolean | null;
  win_v2?: string | null; // "GOOD_WINS" | "EVIL_WINS" | etc.
  player_characters: (Character & {
    name: string | null;
    alignment?: Alignment;
    role?: {
      type?: string | null;
    } | null;
  })[];
};

const props = defineProps<{
  games: GameWithChars[];
}>();


/**
 * Determine the character used for stats in a game.
 *
 * Currently this uses the last character in `player_characters`,
 * which represents the role a player ended the game as.
 *
 * Games flagged with `ignore_for_stats`, games without characters,
 * nameless characters, and Fabled roles are ignored.
 */
function getStatsCharacter(game: GameWithChars) {
  if (game.ignore_for_stats) return null;
  if (!game.player_characters.length) return null;

  const last = game.player_characters.at(-1);
  if (!last || !last.name) return null;
  if (last.role?.type === "FABLED" || last.role?.type === "LORIC") return null;

  return last;
}

/**
 * All months for which there is at least one valid game.
 */
const monthKeys = computed(() => {
  const set = new Set<string>();

  for (const game of props.games) {
    const last = getStatsCharacter(game);
    if (!last) continue;

    const key = dayjs(game.date).tz("UTC").format("YYYY-MM");
    set.add(key);
  }

  return Array.from(set).sort(); // works fine for YYYY-MM
});

const monthLabels = computed(() =>
  monthKeys.value.map((key) => dayjs(key + "-01").format("MM-YY"))
);

/**
 * Build monthly win rates (%), based on games where a clear
 * win/loss can be determined for the player's alignment.
 */
const winRates = computed(() => {
  const map: Record<string, { decided: number; wins: number }> = {};

  for (const game of props.games) {
    const last = getStatsCharacter(game);
    if (!last) continue;

    const alignment = last.alignment as Alignment;

    if (!alignment) continue;

    const result = game.win_v2;
    const key = dayjs(game.date).tz("UTC").format("YYYY-MM");

    if (!map[key]) {
      map[key] = { decided: 0, wins: 0 };
    }

    const goodWins = result === "GOOD_WINS";
    const evilWins = result === "EVIL_WINS";

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
      map[key].decided++;
      if (isWin) {
        map[key].wins++;
      }
    }
  }

  // Return % per month in the same order as monthKeys
  return monthKeys.value.map((key) => {
    const entry = map[key];
    if (!entry || !entry.decided) return 0;
    return (entry.wins / entry.decided) * 100;
  });
});

const chartData = computed(() => ({
  labels: monthLabels.value,
  datasets: [
    {
      label: "Win rate",
      data: winRates.value,
      backgroundColor: chartColors.good,
      borderColor: chartColors.good,
      tension: 0.2,
      fill: false,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: {
        stepSize: 10,
        callback: (value: number) => `${value}%`,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.parsed.y.toFixed(0)}% win rate`,
      },
    },
  },
}));
</script>

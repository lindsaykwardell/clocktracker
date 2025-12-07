<template>
  <div class="w-full h-40 md:h-48">
    <Doughnut id="win-rate-over-time" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import type { Game, Character } from "@prisma/client";
import { chartColors } from "~/composables/useChartColors";

type Alignment = "GOOD" | "EVIL" | null;
type Side = "GOOD" | "EVIL";

type SideStats = {
  decided: number;
  wins: number;
};

type GameWithChars = Game & {
  ignore_for_stats?: boolean | null;
  win_v2?: string | null;
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

const winStats = computed<Record<Side, SideStats>>(() => {
  const stats: Record<Side, SideStats> = {
    GOOD: { decided: 0, wins: 0 },
    EVIL: { decided: 0, wins: 0 },
  };

  for (const game of props.games) {
    const last = getStatsCharacter(game);
    if (!last || !last.alignment) continue;

    const alignment = last.alignment as Side;
    const result = game.win_v2;

    const goodWins = result === "GOOD_WINS";
    const evilWins = result === "EVIL_WINS";

    const isWin =
      (alignment === "GOOD" && goodWins) ||
      (alignment === "EVIL" && evilWins);
    const isLoss =
      (alignment === "GOOD" && evilWins) ||
      (alignment === "EVIL" && goodWins);

    if (!isWin && !isLoss) continue;

    stats[alignment].decided++;
    if (isWin) {
      stats[alignment].wins++;
    }
  }

  return stats;
});

const winPercentages = computed(() => {
  const stats = winStats.value;

  return {
    good:
      stats.GOOD.decided === 0
        ? 0
        : (stats.GOOD.wins / stats.GOOD.decided) * 100,
    evil:
      stats.EVIL.decided === 0
        ? 0
        : (stats.EVIL.wins / stats.EVIL.decided) * 100,
  };
});

const chartData = computed(() => ({
  labels: ["Win %", "Remaining"],
  datasets: [
    {
      label: "Good",
      data: [
        winPercentages.value.good,
        Math.max(0, 100 - winPercentages.value.good),
      ],
      backgroundColor: [chartColors.good, "rgba(0,0,0,0.08)"],
      borderWidth: 0,
    },
    {
      label: "Evil",
      data: [
        winPercentages.value.evil,
        Math.max(0, 100 - winPercentages.value.evil),
      ],
      backgroundColor: [chartColors.evil, "rgba(0,0,0,0.15)"],
      borderWidth: 0,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "0%",
  plugins: {
    legend: {
      display: false,
    },
    datalabels: {
      display: true,
      color: chartColors.labelColor,
      anchor: "center",
      align: "center",
      clamp: true,
      backgroundColor: chartColors.labelBackground,
      borderRadius: chartColors.labelRadius,
      padding: chartColors.labelPadding,
      formatter(value: number, context: any) {
        // Only label the win slice.
        if (context.dataIndex !== 0) return null;
        return `${Math.round(value)}%`;
      },
    },
    tooltip: {
      filter: (ctx: any) => ctx.dataIndex === 0, // hide tooltip on empty slice.
      callbacks: {
        label: (ctx: any) => {
          const alignment = ctx.dataset.label === "Good" ? "GOOD" : "EVIL";
          const stats = winStats.value[alignment];
          const percent = ctx.parsed ?? 0;
          const decided = stats?.decided ?? 0;
          const wins = stats?.wins ?? 0;

          return `${ctx.dataset.label}: ${percent.toFixed(0)}% (W/L: ${wins}/${decided})`;
        },
      },
    },
  },
}));
</script>

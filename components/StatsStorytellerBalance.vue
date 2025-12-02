<template>
  <div class="h-36 md:h-48">
    <Pie
      id="storyteller-win-balance"
      :data="chartData"
      :options="chartOptions"
    />
  </div>

  <div v-if="hasGames" class="text-center text-sm text-balance max-w-44 mt-2 mx-auto">
    <span v-if="goodPct >= 0.75">
      <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span> often prevails.
    </span>

    <span v-else-if="goodPct >= 0.60">
      <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span> has a gentle edge.
    </span>

    <span v-else-if="evilPct >= 0.75">
      <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span> often triumphs.
    </span>

    <span v-else-if="evilPct >= 0.60">
      <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span> has a subtle advantage.
    </span>

    <span v-else>
      Games appear <span class="font-semibold">balanced</span> between both teams.
    </span>
  </div>
</template>


<script setup lang="ts">
import { computed } from "vue";
import { Pie } from "vue-chartjs";
import type { GameRecord } from "~/composables/useGames";
import { WinStatus_V2, filterStorytellerGames } from "~/composables/useGames";
import { chartColors } from "~/composables/useChartColors";

const props = defineProps<{
  games: GameRecord[];
  username: string;
}>();

/**
 * Storyteller games for this user.
 */
const storytellerGames = computed(() =>
  filterStorytellerGames(props.games, props.username)
);

/**
 * Aggregate storyteller wins by team.
 */
const winCounts = computed(() => {
  let good = 0;
  let evil = 0;

  for (const game of storytellerGames.value) {
    if (game.win_v2 === WinStatus_V2.GOOD_WINS) good++;
    else if (game.win_v2 === WinStatus_V2.EVIL_WINS) evil++;
  }

  return { good, evil };
});

const goodWins = computed(() => winCounts.value.good);
const evilWins = computed(() => winCounts.value.evil);

/**
 * Balance message.
 */
const totalGames = computed(() => goodWins.value + evilWins.value);
const hasGames = computed(() => totalGames.value > 0);

const goodPct = computed(() =>
  hasGames.value ? goodWins.value / totalGames.value : 0
);

const evilPct = computed(() =>
  hasGames.value ? evilWins.value / totalGames.value : 0
);

/**
 * Chart data and config.
 */
const chartData = computed(() => ({
  labels: ["Good wins", "Evil wins"],
  datasets: [
    {
      data: [goodWins.value, evilWins.value],
      backgroundColor: [chartColors.good, chartColors.evil],
      borderWidth: 0,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: 0,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      callbacks: {
        label(context: any) {
          const label = context.label || "";
          const value = context.parsed as number;

          const dataArr =
            (context.chart.data.datasets[0].data as number[]) || [];
          const total = dataArr.reduce((sum, v) => sum + (v || 0), 0);

          const pct =
            total === 0 ? 0 : Math.round((value / total) * 100);

          return `${label}: ${value} game${
            value === 1 ? "" : "s"
          } (${pct}%)`;
        },
      },
    },
  },
}));
</script>

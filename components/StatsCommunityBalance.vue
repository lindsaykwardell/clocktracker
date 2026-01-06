<template>
  <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2">
    <h3 class="font-sorts text-center text-lg lg:text-xl">
      Game Balance
    </h3>

    <div class="h-36 md:h-48">
      <Pie
        id="community-win-balance"
        :data="chartData"
        :options="chartOptions"
      />
    </div>

    <div v-if="hasGames" class="text-center text-sm text-balance max-w-60 mt-2 mx-auto">
      <span v-if="goodPct >= 0.75">
        <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span> often prevails here.
      </span>
      <span v-else-if="goodPct >= 0.60">
        <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span> has a gentle edge.
      </span>
      <span v-else-if="evilPct >= 0.75">
        <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span> often triumphs here.
      </span>
      <span v-else-if="evilPct >= 0.60">
        <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span> has a subtle advantage.
      </span>
      <span v-else>
        Games look <span class="font-semibold">balanced</span> between both teams.
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Pie } from "vue-chartjs";
import type { GameRecord } from "~/composables/useGames";
import { WinStatus_V2 } from "~/composables/useGames";
import { chartColors } from "~/composables/useChartColors";

const props = defineProps<{
  games: GameRecord[];
}>();

const communityGames = computed(() =>
  props.games.filter((g) => !g.ignore_for_stats)
);

const winCounts = computed(() => {
  let good = 0;
  let evil = 0;

  for (const game of communityGames.value) {
    if (game.win_v2 === WinStatus_V2.GOOD_WINS) good++;
    else if (game.win_v2 === WinStatus_V2.EVIL_WINS) evil++;
  }

  return { good, evil };
});

const goodWins = computed(() => winCounts.value.good);
const evilWins = computed(() => winCounts.value.evil);
const totalGames = computed(() => goodWins.value + evilWins.value);
const hasGames = computed(() => totalGames.value > 0);

const goodPct = computed(() =>
  hasGames.value ? goodWins.value / totalGames.value : 0
);
const evilPct = computed(() =>
  hasGames.value ? evilWins.value / totalGames.value : 0
);

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
      formatter(value: number) {
        const total = totalGames.value || 0;
        if (!value || total === 0) return null;
        const pct = Math.round((value / total) * 100);
        return `${pct}%`;
      },
    },
    tooltip: {
      callbacks: {
        label(context: any) {
          const label = context.label || "";
          const value = context.parsed as number;
          const dataArr =
            (context.chart.data.datasets[0].data as number[]) || [];
          const total = dataArr.reduce((sum, v) => sum + (v || 0), 0);
          const pct = total === 0 ? 0 : Math.round((value / total) * 100);
          return `${label}: ${value} game${value === 1 ? "" : "s"} (${pct}%)`;
        },
      },
    },
  },
}));
</script>

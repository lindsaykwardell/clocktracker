<template>
  <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40">
    <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
      Player Count
    </h3>

    <div class="h-36 md:h-48">
      <Pie
        id="storyteller-player-count"
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Pie } from "vue-chartjs";
import type { GameRecord } from "~/composables/useGames";
import { filterStorytellerGames } from "~/composables/useGames";
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
 * Pick a color based on total (players + travelers), clamped to p5–p20.
 */
function colorForTotalPlayers(total: number): string {
  const clamped = Math.min(20, Math.max(5, total));
  const key = `p${clamped}` as keyof typeof chartColors;
  return chartColors[key] ?? "#6B21A8";
}

type SplitInfo = {
  playerCount: number;
  travelerCount: number;
  count: number;
};

type PlayerCountGroup = {
  label: string;
  effectiveCount: number; // players + travelers
  totalCount: number;     // total games with effectiveCount
  splits: SplitInfo[];    // e.g. 11, 10+1, 9+2
};

/**
 * One group per effective player count (players + travelers).
 */
const groups = computed<PlayerCountGroup[]>(() => {
  // effectiveCount -> (travelerCount -> SplitInfo)
  const groupMap = new Map<number, Map<number, SplitInfo>>();

  for (const game of storytellerGames.value) {
    const playerCount = game.player_count ?? 0;
    const travelerCount = game.traveler_count ?? 0;

    if (!playerCount && !travelerCount) continue;

    const effectiveCount = playerCount + travelerCount;

    if (!groupMap.has(effectiveCount)) {
      groupMap.set(effectiveCount, new Map());
    }

    const splitMap = groupMap.get(effectiveCount)!;

    if (!splitMap.has(travelerCount)) {
      splitMap.set(travelerCount, {
        playerCount,
        travelerCount,
        count: 0,
      });
    }

    const split = splitMap.get(travelerCount)!;
    split.count += 1;
  }

  const result: PlayerCountGroup[] = [];

  for (const [effectiveCount, splitMap] of groupMap.entries()) {
    const splits = Array.from(splitMap.values())
      .filter((s) => s.count > 0)
      .sort((a, b) => a.travelerCount - b.travelerCount);

    const totalCount = splits.reduce((sum, s) => sum + s.count, 0);

    const label =
      effectiveCount === 1 ? "1 player" : `${effectiveCount} players`;

    result.push({
      label,
      effectiveCount,
      totalCount,
      splits,
    });
  }

  result.sort((a, b) => a.effectiveCount - b.effectiveCount);

  return result;
});

const grandTotal = computed(() =>
  groups.value.reduce((sum, g) => sum + g.totalCount, 0)
);

/**
 * Assign a color per effective player count.
 */
const backgroundColors = computed(() =>
  groups.value.map((group) => colorForTotalPlayers(group.effectiveCount))
);

const chartData = computed(() => ({
  labels: groups.value.map((g) => g.label),
  datasets: [
    {
      data: groups.value.map((g) => g.totalCount),
      backgroundColor: backgroundColors.value,
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
    tooltip: {
      callbacks: {
        // @ts-expect-error Chart.js context typing
        title(context) {
          const idx = context[0].dataIndex;
          const group = groups.value[idx];
          if (!group) return "";

          const groupPct =
            grandTotal.value === 0
              ? 0
              : Math.round((group.totalCount / grandTotal.value) * 100);

          return `${group.effectiveCount} players - ${group.totalCount} game${
            group.totalCount === 1 ? "" : "s"
          } (${groupPct}%)`;
        },
        // @ts-expect-error Chart.js context typing
        label(context) {
          const idx = context.dataIndex;
          const group = groups.value[idx];
          if (!group) return "";

          const lines: string[] = [];

          for (const split of group.splits) {
            const { playerCount, travelerCount, count } = split;
            const label =
              travelerCount === 0
                ? `${playerCount} players`
                : `${playerCount} + ${travelerCount} players`;

            lines.push(
              `${count} game${count === 1 ? "" : "s"} with ${label}`
            );
          }

          return lines;
        },
      },
    },
  },
}));
</script>

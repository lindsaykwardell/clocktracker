<template>
  <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40">
    <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
      Minion Count
    </h3>

    <div class="h-36 md:h-48">
      <Pie
        id="community-script-size-minions"
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
import { chartColors } from "~/composables/useChartColors";

const props = defineProps<{
  games: GameRecord[];
}>();

/**
 * Game size keys.
 */
type GameSizeKey = "teensy" | "one" | "two" | "three";

type SplitInfo = {
  playerCount: number;
  travelerCount: number;
  count: number;
};

type Bucket = {
  key: GameSizeKey;
  label: string;
  color: string;
  totalCount: number;
  splits: SplitInfo[];
};

/**
 * Map player count (excluding travelers) to a gameSize.
 */
function getGameSizeKey(playerCount: number | null | undefined): GameSizeKey | null {
  if (!playerCount) return null;
  if (playerCount <= 6) return "teensy";
  if (playerCount <= 9) return "one";
  if (playerCount <= 12) return "two";
  return "three";
}

/**
 * Labels and colors for each gameSize.
 */
const gameSizeMeta: Record<GameSizeKey, { label: string; color: string }> = {
  teensy: {
    label: "Teensy (1 Minion)",
    color: chartColors.teensy,
  },
  one: {
    label: "1 Minion",
    color: chartColors.small,
  },
  two: {
    label: "2 Minions",
    color: chartColors.medium,
  },
  three: {
    label: "3 Minions",
    color: chartColors.large,
  },
};

/**
 * Build gameSizes based on player_count, with splits per (player_count, traveler_count).
 */
const gameSizes = computed<Bucket[]>(() => {
  const gameSizeMap = new Map<GameSizeKey, Map<string, SplitInfo>>();

  for (const game of props.games) {
    if (game.ignore_for_stats) continue;

    const playerCount = game.player_count ?? 0;
    const travelerCount = game.traveler_count ?? 0;
    if (!playerCount && !travelerCount) continue;

    const gameSizeKey = getGameSizeKey(playerCount);
    if (!gameSizeKey) continue;

    if (!gameSizeMap.has(gameSizeKey)) {
      gameSizeMap.set(gameSizeKey, new Map());
    }

    const splitKey = `${playerCount}-${travelerCount}`;
    const splitMap = gameSizeMap.get(gameSizeKey)!;

    if (!splitMap.has(splitKey)) {
      splitMap.set(splitKey, { playerCount, travelerCount, count: 0 });
    }
    splitMap.get(splitKey)!.count += 1;
  }

  const result: Bucket[] = [];

  for (const [key, splitMap] of gameSizeMap.entries()) {
    const splits = Array.from(splitMap.values()).sort((a, b) => {
      if (a.playerCount !== b.playerCount) {
        return a.playerCount - b.playerCount;
      }
      return a.travelerCount - b.travelerCount;
    });

    const totalCount = splits.reduce((sum, s) => sum + s.count, 0);
    const meta = gameSizeMeta[key];

    result.push({
      key,
      label: meta.label,
      color: meta.color,
      totalCount,
      splits,
    });
  }

  const order: GameSizeKey[] = ["teensy", "one", "two", "three"];
  result.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  return result;
});

const grandTotal = computed(() =>
  gameSizes.value.reduce((sum, b) => sum + b.totalCount, 0)
);

const chartData = computed(() => ({
  labels: gameSizes.value.map((b) => b.label),
  datasets: [
    {
      data: gameSizes.value.map((b) => b.totalCount),
      backgroundColor: gameSizes.value.map((b) => b.color),
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
      formatter(_value: number, context: any) {
        const idx = context.dataIndex;
        const gameSize = gameSizes.value[idx];
        if (!gameSize) return "";

        if (gameSize.key === "teensy") return "Teensy";
        if (gameSize.key === "one") return "1 Minion";
        if (gameSize.key === "two") return "2 Minions";
        return "3 Minions";
      },
    },
    tooltip: {
      callbacks: {
        title(context: any) {
          const idx = context[0].dataIndex;
          const gameSize = gameSizes.value[idx];
          if (!gameSize) return "";

          const gameSizePct =
            grandTotal.value === 0
              ? 0
              : Math.round((gameSize.totalCount / grandTotal.value) * 100);

          return `${gameSize.label} - ${gameSize.totalCount} game${
            gameSize.totalCount === 1 ? "" : "s"
          } (${gameSizePct}%)`;
        },
        label(context: any) {
          const idx = context.dataIndex;
          const gameSize = gameSizes.value[idx];
          if (!gameSize) return "";

          const lines: string[] = [];

          for (const split of gameSize.splits) {
            const { playerCount, travelerCount, count } = split;

            const travelersPart =
              travelerCount === 0 ? "" : ` + ${travelerCount}`;

            lines.push(
              `${count} game${count === 1 ? "" : "s"} with ${playerCount}${travelersPart} players`
            );
          }

          return lines;
        },
      },
    },
  },
}));
</script>

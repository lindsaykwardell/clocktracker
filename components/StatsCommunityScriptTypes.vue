<template>
  <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40">
    <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
      Script Types
    </h3>

    <div class="h-36 md:h-48">
      <Pie
        id="community-script-types"
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

const { Script } = useScripts();

const props = defineProps<{
  games: GameRecord[];
}>();

type ScriptCounts = {
  troubleBrewing: number;
  sectsAndViolets: number;
  badMoonRising: number;
  customScript: number;
  unknownScript: number;
};

const scriptCounts = computed<ScriptCounts>(() => {
  const counts: ScriptCounts = {
    troubleBrewing: 0,
    sectsAndViolets: 0,
    badMoonRising: 0,
    customScript: 0,
    unknownScript: 0,
  };

  for (const game of props.games) {
    if (game.ignore_for_stats) continue;
    const scriptName = (game.script ?? "").trim();

    if (!scriptName) {
      counts.unknownScript++;
    } else if (scriptName === Script.TroubleBrewing) {
      counts.troubleBrewing++;
    } else if (scriptName === Script.SectsAndViolets) {
      counts.sectsAndViolets++;
    } else if (scriptName === Script.BadMoonRising) {
      counts.badMoonRising++;
    } else {
      counts.customScript++;
    }
  }

  return counts;
});

const chartData = computed(() => ({
  labels: [
    "Trouble Brewing",
    "Sects & Violets",
    "Bad Moon Rising",
    "Custom",
    "Unknown",
  ],
  datasets: [
    {
      data: [
        scriptCounts.value.troubleBrewing,
        scriptCounts.value.sectsAndViolets,
        scriptCounts.value.badMoonRising,
        scriptCounts.value.customScript,
        scriptCounts.value.unknownScript,
      ],
      backgroundColor: [
        chartColors.tb,
        chartColors.snv,
        chartColors.bmr,
        chartColors.custom,
        chartColors.unknown,
      ],
      borderWidth: 0,
    },
  ],
}));

const scriptAbbreviations = ["TB", "S&V", "BMR", "Custom", "?"];
const LABEL_MIN_PCT = 3;

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
        const value =
          (context?.dataset?.data?.[idx] as number | undefined) ?? 0;
        const total =
          ((context?.chart?.data?.datasets?.[0]?.data as number[]) || []).reduce(
            (sum, v) => sum + (v || 0),
            0
          );
        const pct = total === 0 ? 0 : (value / total) * 100;
        if (!value || pct < LABEL_MIN_PCT) return null;
        return scriptAbbreviations[idx] ?? "?";
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

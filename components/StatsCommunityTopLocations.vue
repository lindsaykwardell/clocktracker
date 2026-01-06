<template>
  <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2">
    <h3 class="font-sorts text-center text-lg lg:text-xl">
      Top Locations
    </h3>

    <div class="h-36 md:h-48">
      <Pie
        id="community-top-locations"
        :data="chartData"
        :options="chartOptions"
      />
    </div>

    <p v-if="summaryText" class="text-center text-sm text-balance max-w-60 mx-auto" v-html="summaryText" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Pie } from "vue-chartjs";
import type { GameRecord } from "~/composables/useGames";
import { chartColors } from "~/composables/useChartColors";

const props = defineProps<{
  games: GameRecord[];
  isMember?: boolean;
}>();

const showDetailedLocations = computed(() => props.isMember !== false);

const ONLINE_COLOR = "#00C2A8"; // teal-ish digital hue
const inPersonPalette = [
  chartColors.p5,
  chartColors.p7,
  chartColors.p9,
  chartColors.p11,
  chartColors.p13,
  chartColors.p15,
  chartColors.p17,
  chartColors.p19,
];

type LocationSlice = {
  name: string;
  count: number;
  color: string;
};

const locationSlices = computed<LocationSlice[]>(() => {
  const counts = new Map<string, number>();

  for (const game of props.games) {
    if (game.ignore_for_stats) continue;

    const isOnline = game.location_type === "ONLINE";
    const name = isOnline ? "Online" : (game.location || "In Person").trim();
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  if (!showDetailedLocations.value) {
    const online = counts.get("Online") ?? 0;
    let inPerson = 0;
    for (const [name, count] of counts.entries()) {
      if (name === "Online") continue;
      inPerson += count;
    }

    const slices: LocationSlice[] = [];
    if (online > 0) slices.push({ name: "Online", count: online, color: ONLINE_COLOR });
    if (inPerson > 0) slices.push({ name: "In Person", count: inPerson, color: inPersonPalette[0] });
    return slices;
  }

  const entries = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  let inPersonColorIdx = 0;
  return entries.map(({ name, count }) => {
    const isOnline = name === "Online";
    const color = isOnline
      ? ONLINE_COLOR
      : inPersonPalette[inPersonColorIdx++ % inPersonPalette.length];
    return { name, count, color };
  });
});

const chartData = computed(() => ({
  labels: locationSlices.value.map((s) => s.name),
  datasets: [
    {
      data: locationSlices.value.map((s) => s.count),
      backgroundColor: locationSlices.value.map((s) => s.color),
      borderWidth: 0,
    },
  ],
}));

const LABEL_MIN_PCT = 5;

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
        return `${Math.round(pct)}%`;
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

const summaryText = computed(() => {
  let online = 0;
  let inPerson = 0;
  for (const game of props.games) {
    if (game.ignore_for_stats) continue;
    if (game.location_type === "ONLINE") online++;
    else inPerson++;
  }
  if (online === 0 && inPerson === 0) return "";
  if (online > 0 && inPerson === 0) {
    return "This community plays all of its games online.";
  }
  if (inPerson > 0 && online === 0) {
    return "This community plays all of its games in person.";
  }
  if (online > inPerson) {
    return "This community plays most of its games online.";
  }
  if (inPerson > online) {
    return 'This community plays most of its games <span class="font-semibold">in person</span>.';
  }
  return 'This community splits its games evenly between <span class="font-semibold">online</span> and <span class="font-semibold">in person</span>.';
});
</script>

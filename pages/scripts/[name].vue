<template>
  <StandardTemplate>
    <section
      class="flex flex-col gap-4 w-full"
    >
      <div class="flex flex-col md:flex-row items-center md:items-stretch">
        <div class="flex-grow flex flex-col p-4 gap-8">
          <div>
            <img
              :src="script.logo ?? scriptLogo(script.name)"
              class="md:hidden w-48 md:w-64 h-48 md:h-64 m-auto"
            />
            <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h1 class="text-3xl font-sorts text-center md:text-start">
                  {{ script.name }}
                </h1>
                <p class="text-lg text-center md:text-start text-stone-500">
                  by <span class="italic">{{ script.author }}</span>
                </p>
              </div>  
              <div
                v-if="scripts.some((s) => s.version)"
                class="flex flex-col md:flex-row gap-2"
              >
                <select
                  v-model="version"
                  class="rounded p-2 text-lg bg-stone-200 dark:bg-stone-600 border-0"
                >
                  <option
                    v-for="version in scripts"
                    :value="version.version"
                    :key="version.version"
                  >
                    {{ version.version }}
                  </option>
                </select>
              </div>
            </div>
            <div class="md:hidden mt-4 flex flex-wrap justify-center gap-1">
              <Button
                component="a"
                :href="scriptLink"
                icon="website"
              >
                Website
              </Button>
              <Button
                component="a"
                v-if="!script.is_custom_script"
                :href="script.json_url"
                icon="json"
              >
                Download JSON
              </Button>
              <Button
                component="a"
                v-else-if="script.json"
                :href="`data:text/json;charset=utf-8,${encodeURIComponent(
                  script.json
                )}`"
                :download="`${script.name.toLowerCase().replaceAll(' ', '-')}.json`"
                icon="json"
              >
                Download JSON
              </Button>
              <Button
                component="a"
                v-if="!script.is_custom_script"
                :href="script.pdf_url"
                icon="pdf"
              >
                Download PDF
              </Button>
            </div>
          </div>

          <div
            v-for="roleGroup in roleGroups"
            :key="roleGroup.name"
            class="break-inside-avoid"
          >
            <template v-if="roleGroup.roles.length">
              <hr class="border-stone-200 dark:border-stone-700/50 w-full mb-4" />
              <div>
                <h2 class="font-sorts text-xl lg:text-2xl">
                  {{ roleGroup.name }}
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 py-4">
                  <a
                    v-for="role in roleGroup.roles"
                    :key="role.id"
                    :href="`/roles/${role.id}`"
                    target="_blank"
                    class="role-card token-wrapper relative flex items-center gap-4 rounded-lg border dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 p-4"
                  >
                    <div class="role-card-token relative shrink-0">
                      <div
                        class="token-chart absolute -left-2 -top-2 transition duration-200 ease-in-out print:hidden"
                      >
                        <Pie
                          :data="roleWinRateData(role)"
                          :options="roleWinRateOptions"
                        />
                      </div>
                      <Token :character="formatRoleAsCharacter(role)" size="md" />
                    </div>
                    <div class="flex min-w-0 flex-col">
                      <h3 class="font-sorts text-balance lg:text-lg">
                        {{ role.name }}
                      </h3>
                      <div class="text-sm text-stone-600 dark:text-stone-400 space-y-[0.125rem]">
                        <template v-if="scriptStats.role_win_rates[role.id]?.total">
                          <div>{{ scriptStats.role_win_rates[role.id].total }}
                            game{{
                              scriptStats.role_win_rates[role.id].total === 1
                                ? ""
                                : "s"
                            }}
                          </div>
                          <div>
                            {{
                              Math.round(
                                (scriptStats.role_win_rates[role.id].win /
                                  scriptStats.role_win_rates[role.id].total) *
                                  100
                              )
                            }}% win rate
                          </div>
                          <div
                            v-if="
                              scriptStats.role_ability_endings[role.id] &&
                              scriptStats.end_trigger_recorded_count
                            "
                            class="text-pretty"
                          >
                            Ended {{
                              Math.round(
                                (scriptStats.role_ability_endings[role.id] /
                                  scriptStats.end_trigger_recorded_count) *
                                  100
                              )
                            }}% of games*
                          </div>
                        </template>
                        <template v-else>No games recorded</template>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </template>
          </div>
          <div class="text-xs text-center text-stone-500 mb-4">* Only includes games with a recorded end trigger.</div>
        </div>

        <div class="flex flex-col gap-4 print:w-full md:w-[22rem] p-4 md:border-l md:dark:border-stone-700/50">
          <div class="flex flex-col gap-1 hidden md:block">
            <img
              :src="script.logo ?? scriptLogo(script.name)"
              class="w-48 md:w-64 h-48 md:h-64 m-auto"
            />
            <div class="flex flex-col items-center gap-1">
              <Button
                component="a"
                :href="scriptLink"
                icon="website"
                wide
              >
                Website
              </Button>
              <Button
                component="a"
                v-if="!script.is_custom_script"
                :href="script.json_url"
                icon="json"
                wide
              >
                Download JSON
              </Button>
              <Button
                component="a"
                v-else-if="script.json"
                :href="`data:text/json;charset=utf-8,${encodeURIComponent(
                  script.json
                )}`"
                :download="`${script.name.toLowerCase().replaceAll(' ', '-')}.json`"
                icon="json"
                wide
              >
                Download JSON
              </Button>
              <Button
                component="a"
                v-if="!script.is_custom_script"
                :href="script.pdf_url"
                icon="pdf"
                wide
              >
                Download PDF
              </Button>
            </div>
          </div>

          <hr class="border-stone-200 dark:border-stone-700/50 w-full" />
          
          <div class="flex flex-col items-center gap-1">
            <h3 class="font-sorts text-xl text-center">Activity</h3>
            <div class="m-auto h-[75px]">
              <Line :data="past12MonthsData" :options="past12MonthsOptions" />
            </div>
            <div class="chart-description">{{ scriptStats.count }} games played</div>
            <div class="chart-description">{{ averageGamesPlayed }} games per week</div>
          </div>
          
          <hr class="border-stone-200 dark:border-stone-700/50 w-full" />

          <div class="flex flex-col items-center gap-1">
            <h3 class="font-sorts text-xl text-center">Win Rate</h3>
            <div class="m-auto w-1/2">
              <Pie :data="winRatioData" :options="winRatioOptions" />
            </div>
            <div class="chart-description">
              Good wins {{ scriptStats.win_loss.pct }}% of games
            </div>
          </div>

          <template v-if="endTriggerCharts.length">
            <hr class="border-stone-200 dark:border-stone-700/50 w-full" />
            <div class="flex flex-col items-center gap-1">
              <h3 class="font-sorts text-xl text-center">Game endings</h3>
            </div>

            <template v-for="chart in endTriggerCharts" :key="chart.key">
              <div class="flex flex-col items-center gap-1">
                <h4 class="font-sorts text-lg text-center">{{ chart.title }}</h4>
                <div class="m-auto w-1/2">
                  <Pie :data="chart.data" :options="endTriggerChartOptions" />
                </div>
                <div class="chart-description mx-auto">
                  {{ chart.summary }}
                </div>
              </div>
              <hr class="border-stone-200 dark:border-stone-700/50 mx-auto w-12" />
            </template>
          </template>
        </div>
      </div>
    </section>
    <section class="border-t dark:border-stone-700/50">
      <h2 class="font-sorts text-xl lg:text-2xl p-4 pt-6">
        Your Games
      </h2>
      <GameOverviewGrid :games="relatedGames" />
    </section>
  </StandardTemplate>
</template>

<script setup lang="ts">
import type { Script, Role, RoleType, Alignment } from "~/server/generated/prisma/client";
import { chartColors } from "~/composables/useChartColors";
import { Line, Pie } from "vue-chartjs";

const route = useRoute();
const router = useRouter();
const { scriptLogo } = useScripts();
const allGames = useGames();
const me = useMe();

const scriptName = route.params.name as string;
const version = ref(route.query.version as string);
const script_id = route.query.id as string;

const scripts = await $fetch<Array<Script & { roles: Role[] }>>(
  `/api/script/name/${encodeURIComponent(
    scriptName
  )}?custom_script_id=${script_id}`
);

if (!version.value) {
  version.value = scripts[0].version;
}

const script = computed(
  () => scripts.find((s) => s.version === version.value) || scripts[0]
);

const relatedGames = computed(() => {
  if (me.value.status !== Status.SUCCESS) return [];

  const games = allGames.getByPlayer(me.value.data.username);

  if (games.status !== Status.SUCCESS) return [];

  return games.data.filter((game) => game.script_id === script.value.id);
});

watchEffect(() => {
  // update the URL when the version changes
  // This needs to be
  if (version.value !== route.query.version) {
    // route.query.version = version.value;
    router.push({ query: { version: version.value, id: script_id } });
  }
});

useHead({
  title: script.value.name,
  meta: [
    {
      key: "description",
      name: "description",
      content: `View stats and recent games for ${script.value.name}.`,
    },
    {
      property: "og:title",
      content: script.value.name,
    },
    {
      property: "og:description",
      content: `View stats and recent games for ${script.value.name}.`,
    },
    {
      property: "og:image",
      content: script.value.logo ?? scriptLogo(script.value.name),
    },
    {
      property: "og:url",
      content: route.fullPath,
    },
    {
      property: "twitter:card",
      content: "summary_large_image",
    },
    {
      property: "twitter:url",
      content: route.fullPath,
    },
    {
      property: "twitter:title",
      content: script.value.name,
    },
    {
      property: "twitter:description",
      content: `View stats and recent games for ${script.value.name}.`,
    },
    {
      property: "twitter:image",
      content: script.value.logo ?? scriptLogo(script.value.name),
    },
  ],
});

const scriptStats = ref<{
  count: number;
  win_loss: {
    total: number;
    win: number;
    loss: number;
    pct: number;
  };
  end_trigger_recorded_count: number;
  end_trigger_counts: Record<string, number>;
  end_trigger_detail_counts: Record<string, Record<string, number>>;
  end_trigger_roles: Record<string, { id: string; name: string }>;
  games_by_month: Record<string, number>;
  role_win_rates: Record<
    string,
    {
      total: number;
      win: number;
      loss: number;
    }
  >;
  role_ability_endings: Record<string, number>;
}>({
  count: 0,
  win_loss: {
    total: 0,
    win: 0,
    loss: 0,
    pct: 0,
  },
  end_trigger_recorded_count: 0,
  end_trigger_counts: {},
  end_trigger_detail_counts: {},
  end_trigger_roles: {},
  games_by_month: {},
  role_win_rates: {},
  role_ability_endings: {},
});

const averageGamesPlayed = computed(() =>
  Math.round(
    Object.values(scriptStats.value.games_by_month).reduce((a, b) => a + b, 0) /
      52
  )
);

function sortRolesByFrequency(roles: Role[]) {
  return [...roles].sort(
    (a, b) =>
      (scriptStats.value.role_win_rates[b.id]?.total ?? 0) -
      (scriptStats.value.role_win_rates[a.id]?.total ?? 0)
  );
}

const townsfolk = computed(() => {
  return sortRolesByFrequency(
    script.value.roles.filter((role) => role.type === "TOWNSFOLK")
  );
});

const outsiders = computed(() => {
  return sortRolesByFrequency(
    script.value.roles.filter((role) => role.type === "OUTSIDER")
  );
});

const minions = computed(() => {
  return sortRolesByFrequency(
    script.value.roles.filter((role) => role.type === "MINION")
  );
});

const demons = computed(() => {
  return sortRolesByFrequency(
    script.value.roles.filter((role) => role.type === "DEMON")
  );
});

const roleGroups = computed(() => {
  return [
    {
      name: "Townsfolk",
      roles: townsfolk.value,
    },
    {
      name: "Outsiders",
      roles: outsiders.value,
    },
    {
      name: "Minions",
      roles: minions.value,
    },
    {
      name: "Demons",
      roles: demons.value,
    },
  ];
});

const past12MonthsData = computed(() => ({
  labels: Object.keys(scriptStats.value.games_by_month),
  datasets: [
    {
      data: Object.values(scriptStats.value.games_by_month),
    },
  ],
}));

const past12MonthsOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      stacked: true,
      ticks: {
        min: 0,
        stepSize: 1,
        max: 4,
        display: false,
      },
    },
    y: {
      stacked: true,
      ticks: {
        min: 0,
        stepSize: 1,
        max: 4,
        // display: false
      },
    },
  },
}));

const winRatioData = computed(() => ({
  labels: ["Good Wins", "Evil Wins"],
  datasets: [
    {
      data: [scriptStats.value.win_loss.win, scriptStats.value.win_loss.loss],
      hoverOffset: 4,
      backgroundColor: [chartColors.good, chartColors.evil],
    },
  ],
}));

const winRatioOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false,
    },
  },
}));

type ChartEntry = {
  label: string;
  total: number;
};

const endTriggerLabelMap: Record<string, string> = {
  TWO_PLAYERS_LEFT_ALIVE: "2 Players Remain",
  NO_LIVING_DEMON: "No Living Demon",
  ADDITIONAL_WIN_CONDITION: "Additional Win Condition",
  GAME_ENDED_EARLY: "Game Ended Early",
  OTHER: "Other",
};

const endTriggerDetailLabelMap: Record<string, string> = {
  NOMINATION_EXECUTION: "Nomination + Execution",
  NOMINATION: "Nomination",
  FAILED_ABILITY: "Failed Ability",
  TYPE_ONLY: "Type Recorded Only",
  UNKNOWN: "Unknown",
};

function chartEntries(
  counts: Record<string, number>,
  labels: Record<string, string>
) {
  return Object.entries(counts)
    .map(([key, total]) => ({
      label: labels[key] ?? key,
      total,
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);
}

const endConditionEntries = computed(() =>
  chartEntries(scriptStats.value.end_trigger_counts, endTriggerLabelMap)
);

function endTriggerDetailEntries(endTrigger: string) {
  return chartEntries(
    scriptStats.value.end_trigger_detail_counts[endTrigger] ?? {},
    endTriggerDetailLabelMap
  )
    .map((entry) => {
      if (!entry.label.startsWith("ABILITY:")) return entry;

      const roleId = entry.label.replace("ABILITY:", "");
      const role =
        script.value.roles.find((role) => role.id === roleId) ??
        scriptStats.value.end_trigger_roles[roleId];

      return {
        ...entry,
        label: role ? `${role.name} Ability` : "Unknown Ability",
      };
    })
    .filter((entry) => entry.label);
}

function chartTotal(entries: ChartEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.total, 0);
}

function chartSummary(chart: {
  key: string;
  entries: ChartEntry[];
}) {
  const { key, entries } = chart;
  const total = chartTotal(entries);
  const biggestSlice = entries[0];

  if (!biggestSlice) return "";

  if (key === "condition") {
    switch (biggestSlice.label) {
      case "No Living Demon":
        return `${biggestSlice.total} of ${total} games* ended with no living Demon.`;
      case "Additional Win Condition":
        return `${biggestSlice.total} of ${total} games* ended through an additional win condition.`;
      case "2 Players Remain":
        return `${biggestSlice.total} of ${total} games* ended with 2 players left alive.`;
      case "Game Ended Early":
        return `${biggestSlice.total} of ${total} games* ended early.`;
      default:
        return `${biggestSlice.total} of ${total} games* ended as ${biggestSlice.label}.`;
    }
  }

  return `${biggestSlice.total} in ${total} of these games ended by ${biggestSlice.label}.`;
}

const endTriggerChartColors = [
  chartColors.p5,
  chartColors.p6,
  chartColors.p7,
  chartColors.p8,
  chartColors.p9,
  chartColors.p10,
  chartColors.p11,
  chartColors.p12,
  chartColors.p13,
  chartColors.p14,
  chartColors.p15,
  chartColors.p16,
  chartColors.p17,
  chartColors.p18,
  chartColors.p19,
  chartColors.p20,
];

function chartColorsForSliceCount(sliceCount: number) {
  if (sliceCount <= 0) return [];
  if (sliceCount === 1) {
    return [
      endTriggerChartColors[Math.floor(endTriggerChartColors.length / 2)],
    ];
  }

  const maxIndex = Math.min(
    endTriggerChartColors.length - 1,
    (sliceCount - 1) * 3
  );

  return Array.from({ length: sliceCount }, (_, index) => {
    const colorIndex = Math.round((index * maxIndex) / (sliceCount - 1));

    return endTriggerChartColors[colorIndex];
  });
}

function pieChartData(entries: ChartEntry[]) {
  const backgroundColor = chartColorsForSliceCount(entries.length);

  return {
    labels: entries.map((entry) => entry.label),
    datasets: [
      {
        data: entries.map((entry) => entry.total),
        hoverOffset: 4,
        backgroundColor,
      },
    ],
  };
}

const endTriggerCharts = computed(() =>
  [
    {
      key: "condition",
      title: "End Condition",
      entries: endConditionEntries.value,
    },
    ...Object.entries(scriptStats.value.end_trigger_counts)
      .sort((a, b) => b[1] - a[1])
      .map(([endTrigger]) => ({
        key: `detail-${endTrigger}`,
        title: endTriggerLabelMap[endTrigger] ?? endTrigger,
        entries: endTriggerDetailEntries(endTrigger),
      })),
  ]
    .filter((chart) => chart.entries.length)
    .map((chart) => ({
      ...chart,
      total: chartTotal(chart.entries),
      summary: chartSummary(chart),
      data: pieChartData(chart.entries),
    }))
);

const endTriggerChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false,
    },
  },
}));

const roleWinRateOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    tooltip: {
      enabled: false,
    },
    legend: {
      display: false,
    },
  },
}));

function roleWinRateData(role: Role) {
  const roleStats = scriptStats.value.role_win_rates[role.id];

  return {
    labels: ["Win", "Loss"],
    datasets: roleStats
      ? [
          {
            data: [roleStats.win, roleStats.loss],
            backgroundColor: [chartColors.win, chartColors.loss],
          },
        ]
      : [],
  };
}

function formatRoleAsCharacter(role: {
  type: RoleType;
  id: string;
  token_url: string;
  name: string;
  initial_alignment: Alignment;
}) {
  return {
    alignment: role.initial_alignment,
    role,
  };
}

const scriptLink = computed(() => {
  if (script.value.name === "Trouble Brewing")
    return "https://wiki.bloodontheclocktower.com/Trouble_Brewing";
  else if (script.value.name === "Bad Moon Rising")
    return "https://wiki.bloodontheclocktower.com/Bad_Moon_Rising";
  else if (script.value.name === "Sects and Violets")
    return "https://wiki.bloodontheclocktower.com/Sects_%26_Violets";
  else if (script.value.website) return script.value.website;
  else {
    return `https://botcscripts.com/script/${script.value.script_id}/${script.value.version}`;
  }
});

watch(
  script,
  async (newScript) => {
    try {
      scriptStats.value = await $fetch<{
        count: number;
        win_loss: {
          total: number;
          win: number;
          loss: number;
          pct: number;
        };
        end_trigger_recorded_count: number;
        end_trigger_counts: Record<string, number>;
        end_trigger_detail_counts: Record<string, Record<string, number>>;
        end_trigger_roles: Record<string, { id: string; name: string }>;
        games_by_month: Record<string, number>;
        role_win_rates: Record<
          string,
          {
            total: number;
            win: number;
            loss: number;
          }
        >;
        role_ability_endings: Record<string, number>;
      }>("/api/script/" + newScript.id + "/stats");
    } catch (e) {
      console.error(e);
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (me.value.status === Status.SUCCESS) {
    allGames.fetchPlayerGames(me.value.data.username);
  }
});
</script>

<style scoped>
.token-wrapper {
  .token-chart {
    @apply opacity-40;
  }

  &:hover {
    .token-chart {
      @apply opacity-100;
    }
  }
}

.token-chart {
  @apply w-24 h-24 md:w-28 md:h-28;
}

.role-card {
  .token {
    @apply w-20 h-20 md:w-24 md:h-24;
  }

  .token-image {
    @apply md:w-16 md:h-16;
  }
}

.chart-description {
  @apply text-sm text-center text-balance text-stone-800 dark:text-stone-300 max-w-44;
}
</style>

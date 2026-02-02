<template>
  <StandardTemplate>
    <section
      class="flex flex-col gap-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 w-full lg:w-4/5 m-auto md:my-8 shadow-lg"
    >
      <div class="flex flex-col md:flex-row items-center md:items-start gap-x-8">
        <div class="flex-grow flex flex-col p-4 gap-4">
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

          <div v-for="roleGroup in roleGroups" class="break-inside-avoid">
            <template v-if="roleGroup.roles.length">
              <hr class="border-stone-400 dark:border-stone-700/50 w-full mb-4" />
              <h2 class="font-sorts text-center text-xl lg:text-2xl">
                {{ roleGroup.name }}
              </h2>
              <div class="flex flex-wrap justify-around gap-3 p-4">
                <a
                  v-for="role in roleGroup.roles"
                  :href="`/roles/${role.id}`"
                  target="_blank"
                  class="token-wrapper hover:underline flex flex-col items-center gap-2"
                >
                  <div class="relative">
                    <div
                      class="token-chart absolute w-24 h-24 md:w-32 md:h-32 -left-2 -top-2 transition duration-200 ease-in-out print:hidden"
                    >
                      <Pie
                        :data="roleWinRateData(role)"
                        :options="roleWinRateOptions"
                      />
                    </div>
                    <Token :character="formatRoleAsCharacter(role)" size="md" />
                  </div>
                  <span>{{ role.name }}</span>
                </a>
              </div>
            </template>
          </div>
        </div>

        <div class="flex flex-col gap-4 print:w-full p-4 md:border-l md:dark:border-stone-700/50">
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

          <hr class="border-stone-400 dark:border-stone-700/50 w-full" />
          
          <div class="flex flex-col items-center gap-1">
            <h3 class="font-sorts text-xl text-center">Activity</h3>
            <div class="m-auto h-[75px]">
              <Line :data="past12MonthsData" :options="past12MonthsOptions" />
            </div>
            <div class="text-right">{{ scriptStats.count }} games played</div>
            <div class="text-right">{{ averageGamesPlayed }} games per week</div>
          </div>
          
          <hr class="border-stone-400 dark:border-stone-700/50 w-full" />

          <div class="flex flex-col items-center gap-1">
            <h3 class="font-sorts text-xl text-center">Win Rate</h3>
            <div class="m-auto w-1/2">
              <Pie :data="winRatioData" :options="winRatioOptions" />
            </div>
            <div class="text-center">
              Good wins {{ scriptStats.win_loss.pct }}% of games
            </div>
          </div>
          
          <hr class="border-stone-400 dark:border-stone-700/50 w-full" />

          <div class="break-inside-avoid">
            <h3 class="font-sorts text-xl text-center">Role Frequency</h3>
            <table class="w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Total</th>
                  <th>Wins</th>
                  <th>Win %</th>
                </tr>
              </thead>
              <tr
                v-for="role in Object.entries(scriptStats.role_win_rates)
                  .filter((role) => script.roles.find((r) => r.id === role[0]))
                  .sort((a, b) => b[1].total - a[1].total)"
              >
                <td>
                  <Button
                    component="a"
                    :href="`/roles/${role[0].toLowerCase().replace(/ /g, '_')}`"
                    target="_blank"
                    variant="link"
                  >
                    {{ script.roles.find((r) => r.id === role[0])!.name }}
                  </Button>
                </td>
                <td class="text-right">{{ role[1].total }}</td>
                <td class="text-right">{{ role[1].win }}</td>
                <td class="text-right">
                  {{
                    role[1].total
                      ? Math.round((role[1].win / role[1].total) * 100)
                      : 0
                  }}%
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </section>
    <GameOverviewGrid :games="relatedGames" />
  </StandardTemplate>
</template>

<script setup lang="ts">
import type { Script, Role, RoleType, Alignment } from "@prisma/client";
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
      hid: "description",
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
  games_by_month: Record<string, number>;
  role_win_rates: Record<
    string,
    {
      total: number;
      win: number;
      loss: number;
    }
  >;
}>({
  count: 0,
  win_loss: {
    total: 0,
    win: 0,
    loss: 0,
    pct: 0,
  },
  games_by_month: {},
  role_win_rates: {},
});

const averageGamesPlayed = computed(() =>
  Math.round(
    Object.values(scriptStats.value.games_by_month).reduce((a, b) => a + b, 0) /
      52
  )
);

const townsfolk = computed(() => {
  return script.value.roles.filter((role) => role.type === "TOWNSFOLK");
});

const outsiders = computed(() => {
  return script.value.roles.filter((role) => role.type === "OUTSIDER");
});

const minions = computed(() => {
  return script.value.roles.filter((role) => role.type === "MINION");
});

const demons = computed(() => {
  return script.value.roles.filter((role) => role.type === "DEMON");
});

const travelers = computed(() => {
  return script.value.roles.filter((role) => role.type === "TRAVELER");
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
    {
      name: "Travelers",
      roles: travelers.value,
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
        games_by_month: Record<string, number>;
        role_win_rates: Record<
          string,
          {
            total: number;
            win: number;
            loss: number;
          }
        >;
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
</style>

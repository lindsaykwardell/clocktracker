<template>
  <StandardTemplate>
    <section
      class="flex flex-col gap-4 bg-gradient-to-b from-stone-100 to-stone-300 text-black w-full lg:w-4/5 m-auto md:my-4 rounded shadow-lg"
    >
      <div
        class="flex flex-col md:flex-row items-center md:items-start px-4 pt-4 gap-8"
      >
        <div class="flex-grow flex flex-col">
          <img
            :src="scriptLogo(script.name)"
            class="md:hidden w-48 md:w-64 h-48 md:h-64 m-auto"
          />
          <div class="flex flex-col md:flex-row gap-4 items-center">
            <div class="flex-grow">
              <h2 class="text-3xl font-dumbledor">
                {{ script.name }}
              </h2>
              <div class="flex flex-col md:flex-row gap-2">
                <div
                  class="font-dumbledor text-lg font-bold bottom-[20px] text-stone-500"
                >
                  By {{ script.author }}
                </div>
              </div>
              <div class="flex flex-col md:flex-row gap-2">
                <div class="font-dumbledor text-lg font-bold bottom-[20px]">
                  <select
                    v-model="version"
                    class="bg-stone-100 text-stone-900 rounded-md p-2"
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
            </div>
          </div>
          <div v-for="roleGroup in roleGroups" class="break-inside-avoid">
            <template v-if="roleGroup.roles.length">
              <h3 class="mt-4 mb-2 mx-4 text-xl font-bold font-dumbledor">
                {{ roleGroup.name }}
              </h3>
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
        <div class="flex flex-col gap-1 print:w-full">
          <img
            :src="scriptLogo(script.name)"
            class="hidden md:block w-48 md:w-64 h-48 md:h-64 m-auto"
          />
          <hr class="border-stone-400 w-full print:hidden" />
          <a
            :href="scriptLink"
            class="flex items-center gap-2 hover:underline hover:text-blue-600 justify-end print:hidden"
          >
            Website
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 256 256"
            >
              <path
                fill="currentColor"
                d="M128 26a102 102 0 1 0 102 102A102.12 102.12 0 0 0 128 26Zm81.57 64h-40.18a139.15 139.15 0 0 0-23.45-50.2A90.32 90.32 0 0 1 209.57 90Zm8.43 38a89.7 89.7 0 0 1-3.83 26h-42.31a159 159 0 0 0 0-52h42.31a89.7 89.7 0 0 1 3.83 26Zm-90 90a1.75 1.75 0 0 1-1.32-.59C113.8 203.54 104.34 185.73 99 166h58c-5.34 19.73-14.8 37.54-27.68 51.41a1.75 1.75 0 0 1-1.32.59Zm-31.69-64a147.48 147.48 0 0 1 0-52h63.38a147.48 147.48 0 0 1 0 52ZM38 128a89.7 89.7 0 0 1 3.83-26h42.31a159 159 0 0 0 0 52H41.83A89.7 89.7 0 0 1 38 128Zm90-90a1.75 1.75 0 0 1 1.32.59C142.2 52.46 151.66 70.27 157 90H99c5.34-19.73 14.8-37.54 27.68-51.41A1.75 1.75 0 0 1 128 38Zm-17.94 1.8A139.15 139.15 0 0 0 86.61 90H46.43a90.32 90.32 0 0 1 63.63-50.2ZM46.43 166h40.18a139.15 139.15 0 0 0 23.45 50.2A90.32 90.32 0 0 1 46.43 166Zm99.51 50.2a139.15 139.15 0 0 0 23.45-50.2h40.18a90.32 90.32 0 0 1-63.63 50.2Z"
              />
            </svg>
          </a>
          <a
            :href="script.json_url"
            class="flex items-center gap-2 hover:underline hover:text-blue-600 justify-end print:hidden"
          >
            Download JSON
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M5 3h2v2H5v5a2 2 0 0 1-2 2a2 2 0 0 1 2 2v5h2v2H5c-1.07-.27-2-.9-2-2v-4a2 2 0 0 0-2-2H0v-2h1a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2m14 0a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1v2h-1a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2v-2h2v-5a2 2 0 0 1 2-2a2 2 0 0 1-2-2V5h-2V3h2m-7 12a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1m-4 0a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1m8 0a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1Z"
              />
            </svg>
          </a>
          <a
            :href="script.pdf_url"
            class="flex items-center gap-2 hover:underline hover:text-blue-600 justify-end print:hidden"
          >
            Download PDF
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 16 16"
            >
              <g fill="currentColor">
                <path
                  d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"
                />
                <path
                  d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102c.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645a19.697 19.697 0 0 0 1.062-2.227a7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136c.075-.354.274-.672.65-.823c.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538c.007.188-.012.396-.047.614c-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686a5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465c.12.144.193.32.2.518c.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416a.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95a11.651 11.651 0 0 0-1.997.406a11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238c-.328.194-.541.383-.647.547c-.094.145-.096.25-.04.361c.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193a11.744 11.744 0 0 1-.51-.858a20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41c.24.19.407.253.498.256a.107.107 0 0 0 .07-.015a.307.307 0 0 0 .094-.125a.436.436 0 0 0 .059-.2a.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198a.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283c-.04.192-.03.469.046.822c.024.111.054.227.09.346z"
                />
              </g>
            </svg>
          </a>
          <hr class="border-stone-400 w-full" />
          <h3 class="font-dumbledor text-xl text-center">Activity</h3>
          <div class="m-auto h-[75px]">
            <Line :data="past12MonthsData" :options="past12MonthsOptions" />
          </div>
          <div class="text-right">{{ scriptStats.count }} games played</div>
          <div class="text-right">{{ averageGamesPlayed }} games per week</div>
          <hr class="border-stone-400 w-full" />
          <h3 class="font-dumbledor text-xl text-center">Win Rate</h3>
          <div class="m-auto w-1/2">
            <Pie :data="winRatioData" :options="winRatioOptions" />
          </div>
          <div class="text-center">
            Good wins {{ scriptStats.win_loss.pct }}% of games
          </div>
          <hr class="border-stone-400 w-full" />
          <div class="break-inside-avoid">
            <h3 class="font-dumbledor text-xl text-center">Role Frequency</h3>
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
                  <a
                    :href="`/roles/${role[0].toLowerCase().replace(/ /g, '_')}`"
                    target="_blank"
                    class="hover:underline"
                  >
                    {{ script.roles.find((r) => r.id === role[0])!.name }}
                  </a>
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
    <GameOverviewGrid :games="recentGames" readonly />
  </StandardTemplate>
</template>

<script setup lang="ts">
import type { Script, Role, RoleType, Alignment } from "@prisma/client";
import type { ChartOptions } from "chart.js";
import { Line, Pie } from "vue-chartjs";

const route = useRoute();
const router = useRouter();
const { scriptLogo } = useScripts();
const allGames = useGames();

const scriptName = route.params.name as string;
const version = ref(route.query.version as string);

const scripts = await $fetch<Array<Script & { roles: Role[] }>>(
  "/api/script/name/" + scriptName
);

if (!version.value) {
  version.value = scripts[0].version;
}

const script = computed(
  () => scripts.find((s) => s.version === version.value) || scripts[0]
);

watchEffect(() => {
  // update the URL when the version changes
  // This needs to be
  if (version.value !== route.query.version) {
    // route.query.version = version.value;
    router.push({ query: { version: version.value } });
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
      content: scriptLogo(script.value.name),
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
      content: scriptLogo(script.value.name),
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

// scriptStats.value = await $fetch<{
//   count: number;
//   win_loss: {
//     total: number;
//     win: number;
//     loss: number;
//     pct: number;
//   };
//   games_by_month: Record<string, number>;
//   role_win_rates: Record<
//     string,
//     {
//       total: number;
//       win: number;
//       loss: number;
//     }
//   >;
// }>("/api/script/" + script.value.id + "/stats");

const recentGames = ref<RecentGameRecord[]>([]);

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
      backgroundColor: ["blue", "red"],
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

const roleWinRateOptions = computed<ChartOptions>(() => ({
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
            backgroundColor: ["blue", "red"],
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
  if (script.value.name === "Bad Moon Rising")
    return "https://wiki.bloodontheclocktower.com/Bad_Moon_Rising";
  if (script.value.name === "Sects and Violets")
    return "https://wiki.bloodontheclocktower.com/Sects_%26_Violets";
  else {
    return `https://botcscripts.com/script/${script.value.script_id}/${script.value.version}/`;
  }
});

watch(
  script,
  async (newScript) => {
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

    recentGames.value = await allGames.fetchRecentGamesForScript(
      script.value.id
    );
  },
  { immediate: true }
);
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

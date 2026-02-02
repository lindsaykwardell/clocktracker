<template>
  <StandardTemplate>
    <section
      class="flex flex-col gap-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 w-full lg:w-4/5 m-auto md:my-8 shadow-lg"
    >
      <div class="flex flex-col md:flex-row items-center md:items-start gap-8">
        <div class="flex-grow flex flex-col p-4 gap-4">
          <div>
            <Token :character="character" size="lg" class="md:hidden m-auto" />
            <div class="flex flex-col md:flex-row gap-4 items-center">
              <div class="flex-grow">
                <h1 class="text-center md:text-left text-3xl font-sorts">
                  {{ role_data.role.name }}
                </h1>
                <p class="text-center md:text-left text-lg text-stone-500">
                  {{ roleType }}
                </p>
                <p
                  class="block md:hidden text-center text-stone-700 dark:text-stone-400 italic max-w-[300px] py-4"
                >
                  {{ role_data.role.ability }}
                </p>
              </div>
            </div>
          </div>

          <hr class="border-stone-400 dark:border-stone-700/50 w-full" />

          <h2 class="font-sorts text-center text-xl lg:text-2xl">
            Scripts
          </h2>
          <div class="flex flex-wrap py-6 justify-center">
            <a
              v-for="script in role_data.popular_scripts"
              :href="`/scripts/${script.script.replaceAll(' ', '_')}?version=${
                script.version
              }${
                script.custom_script_id ? `&id=${script.custom_script_id}` : ''
              }`"
              target="_blank"
              class="script-wrapper hover:underline flex flex-col items-center gap-2 w-[150px] md:w-[200px] lg:w-1/2 xl:w-1/3 text-center p-2"
            >
              <div class="relative flex justify-center items-center">
                <div
                  class="script-chart absolute w-32 h-32 md:w-44 md:h-44 -left-2 -top-2 transition duration-200 ease-in-out print:hidden"
                >
                  <Pie
                    :data="
                      perScriptRadioData(
                        script.wins,
                        script.count - script.wins
                      )
                    "
                    :options="scriptWinRatioOptions"
                  />
                </div>
                <img
                  class="token relative z-20 w-28 h-28 md:w-40 md:h-40 transition duration-200 rounded-full overflow-visible aspect-square"
                  :src="script.logo ?? scripts.scriptLogo(script.script)"
                />
              </div>
              <span>{{ script.script }}</span>
            </a>
          </div>
        </div>

        <div class="flex flex-col gap-4 print:w-full p-4 border-l dark:border-stone-700/50">
          <div class="flex flex-col gap-1">
            <Token
              :character="character"
              size="lg"
              class="hidden md:flex m-auto"
            />
            <p
              class="hidden md:block text-center text-stone-700 dark:text-stone-400 italic max-w-[300px] py-4"
            >
              {{ role_data.role.ability }}
            </p>
            <div class="text-center">
              <Button
                component="a"
                :href="wikiUrl"
                icon="website"
                wide
              >
                Website
              </Button>
            </div>
          </div>
          
          <hr class="border-stone-400 dark:border-stone-700/50 w-full" />

          <div class="flex flex-col gap-1">
            <h3 class="font-sorts text-xl text-center">Activity</h3>
            <div class="m-auto h-[75px]">
              <Line :data="past12MonthsData" :options="past12MonthsOptions" />
            </div>
            <div class="text-right">{{ role_data.count }} games played</div>
            <div class="text-right">{{ averageGamesPlayed }} games per week</div>
          </div>
          
          <hr class="border-stone-400 dark:border-stone-700/50 w-full" />

          <div class="flex flex-col gap-1">
            <h3 class="font-sorts text-xl text-center">Win Rate</h3>
            <div class="m-auto w-1/2">
              <Pie :data="winRatioData" :options="winRatioOptions" />
            </div>
            <div class="text-center">
              Wins {{ role_data.win_loss.pct }}% of games
            </div>
          </div>
          
          <hr class="border-stone-400 dark:border-stone-700/50 w-full" />

          <div class="break-inside-avoid">
            <h3 class="font-sorts text-xl text-center">Popular Scripts</h3>
            <table class="w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Total</th>
                  <th>Wins</th>
                  <th>Win %</th>
                </tr>
              </thead>
              <tr v-for="script in topTenScripts">
                <td>
                  <Button
                    component="a"
                    :href="`/scripts/${script.script.replaceAll(
                      ' ',
                      '_'
                    )}?version=${script.version}${
                      script.custom_script_id
                        ? `&id=${script.custom_script_id}`
                        : ''
                    }`"
                    target="_blank"
                    variant="link"
                  >
                    {{ script.script }}
                  </Button>
                </td>
                <td class="text-right">{{ script.count }}</td>
                <td class="text-right">{{ script.wins }}</td>
                <td class="text-right">{{ script.pct }}%</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </section>
    <GameOverviewGrid :games="myGamesWithRole" />
  </StandardTemplate>
</template>

<script setup lang="ts">
import { Line, Pie } from "vue-chartjs";
import { chartColors } from "~/composables/useChartColors";

const route = useRoute();
const role_id = route.params.role_id as string;
const games = useGames();
const user = useSupabaseUser();
const users = useUsers();
const scripts = useScripts();
const me = useMe();

const myGamesWithRole = computed(() => {
  if (!user.value) return [];
  const me = users.getUserById(user.value.id);

  if (me.status !== Status.SUCCESS) return [];
  const myGames = games.getByPlayer(me.data.username);

  if (myGames.status !== Status.SUCCESS) return [];

  return myGames.data.filter((game) =>
    game.player_characters.some((character) => character.role_id === role_id)
  );
});

const topTenScripts = computed(() =>
  [...role_data.popular_scripts].slice(0, 10)
);

const role_data = await $fetch(`/api/role/${role_id}`);

const character = computed(() => ({
  alignment: role_data.role.initial_alignment,
  name: role_data.role.name,
  role: role_data.role,
}));

const past12MonthsData = computed(() => ({
  labels: Object.keys(role_data.games_by_month),
  datasets: [
    {
      data: Object.values(role_data.games_by_month),
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

const averageGamesPlayed = computed(() =>
  Math.round(
    Object.values(role_data.games_by_month).reduce((a, b) => a + b, 0) / 52
  )
);

const winRatioData = computed(() => ({
  labels: ["Win", "Loss"],
  datasets: [
    {
      data: [role_data.win_loss.wins, role_data.win_loss.losses],
      hoverOffset: 4,
      backgroundColor: [chartColors.win, chartColors.loss],
    },
  ],
}));

function perScriptRadioData(wins: number, losses: number) {
  return {
    labels: ["Win", "Loss"],
    datasets: [
      {
        data: [wins, losses],
        hoverOffset: 4,
        backgroundColor: [chartColors.win, chartColors.loss],
      },
    ],
  };
}

const winRatioOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false,
    },
  },
}));

const scriptWinRatioOptions = computed(() => ({
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

const wikiUrl = computed(() => {
  // The role_id is a snake cased version of the role name
  // The wiki URL is the same, but with capital first letters
  // We need to split the role_id on underscores, capitalize each word, and then join them back together

  const wiki_role_name = role_id
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("_");

  return `https://wiki.bloodontheclocktower.com/${wiki_role_name}`;
});

const roleType = computed(() => {
  const type = role_data.role.type ?? "";
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
});

onMounted(() => {
  if (me.value.status === Status.SUCCESS) {
    games.fetchPlayerGames(me.value.data.username);
  }
});

useHead({
  title: () => `${role_data.role.name}`,
});

</script>

<style scoped>
.script-wrapper {
  .script-chart {
    @apply opacity-40;
  }

  &:hover {
    .script-chart {
      @apply opacity-100;
    }
  }
}

.token {
  background-image: url("/img/token-bg.png");
  /* cover and fit the bg */
  background-size: cover;
  background-position: center;
}
</style>

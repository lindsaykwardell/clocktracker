<template>
  <StandardTemplate>
    <section
      class="flex flex-col gap-4 w-full"
    >
      <div class="flex flex-col md:flex-row items-center md:items-stretch">
        <div class="flex-grow flex flex-col p-4 gap-6">
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

          <template v-if="role_data.role_stat_cards.length">
            <hr class="border-stone-200 dark:border-stone-700/50 w-full" />
            <div>
              <h2 class="font-sorts text-xl lg:text-2xl">
                Statistic Cards
              </h2>
              <ul class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 py-4">
                <RoleStatCard
                  v-for="card in role_data.role_stat_cards"
                  variant="horizontal"
                  :key="card.metric_key"
                  :card="card"
                  :games="[]"
                  :isMe="false"
                  :showFavoriteControl="false"
                  :showHiddenStyling="false"
                  :showRoleImage="false"
                  showZeroOverlay
                />
              </ul>
            </div>
          </template>

          <hr class="border-stone-200 dark:border-stone-700/50 w-full" />
          <div>
            <h2 class="font-sorts text-xl lg:text-2xl">
              Scripts
            </h2>
            <div class="script-list grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 py-4">
              <a
                v-for="script in role_data.popular_scripts"
                :key="`${script.script}-${script.version ?? 'unknown'}`"
                class="script-wrapper relative flex items-center gap-4 rounded-lg border dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 p-4"
              >
                <div class="flex-none relative flex justify-center items-center">
                  <div
                    class="script-chart absolute -left-2 -top-2 transition duration-200 ease-in-out print:hidden"
                  >
                    <Pie
                      :data="perScriptChartData[script.script]"
                      :options="scriptWinRatioOptions"
                    />
                  </div>
                  <img
                    class="token relative z-20 transition duration-200 rounded-full overflow-visible aspect-square"
                    :src="script.logo ?? scripts.scriptLogo(script.script)"
                  />
                </div>
                <div>
                  <h3 class="font-sorts text-balance lg:text-lg">
                    <a
                      :href="`/scripts/${script.script.replaceAll(' ', '_')}?version=${
                        script.version
                      }${
                        script.custom_script_id ? `&id=${script.custom_script_id}` : ''
                      }`"
                      target="_blank"
                      class="role-link"
                    >
                      {{ script.script }}
                    </a>
                  </h3>
                  <div class="text-sm text-stone-600 dark:text-stone-400 space-y-[0.125rem]">
                    <div>
                      {{ script.count }} game{{ script.count === 1 ? "" : "s" }}
                    </div>
                    <div>
                      {{ script.pct }}% win rate
                    </div>
                    <div v-if="script.ability_endings">
                      Ended {{ script.ability_endings }} game{{
                        script.ability_endings === 1 ? "" : "s"
                      }}
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
          
          <div class="text-xs text-center text-stone-500 mb-4">* Only includes games with a recorded end trigger.</div>
        </div>

        <!-- Sidebar -->
        <div class="flex flex-col gap-4 print:w-full md:w-[22rem] p-4 border-l dark:border-stone-700/50">
          <div class="flex flex-col gap-1">
            <Token
              :character="character"
              size="lg"
              class="hidden md:flex m-auto"
            />
            <p
              class="hidden md:block text-center text-stone-700 dark:text-stone-400 italic m-auto max-w-[300px] py-4"
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
          
          <hr class="border-stone-200 dark:border-stone-700/50 w-full" />

          <div class="flex flex-col gap-1">
            <h3 class="font-sorts text-xl text-center">Activity</h3>
            <div class="m-auto h-[75px]">
              <Line :data="past12MonthsData" :options="past12MonthsOptions" />
            </div>
            <div class="chart-description mx-auto">{{ role_data.count }} games played</div>
            <div class="chart-description mx-auto">{{ averageGamesPlayed }} games per week</div>
          </div>
          
          <hr class="border-stone-200 dark:border-stone-700/50 w-full" />

          <div class="flex flex-col gap-1">
            <h3 class="font-sorts text-xl text-center">Win Rate</h3>
            <div class="m-auto w-1/2">
              <Pie :data="winRatioData" :options="winRatioOptions" />
            </div>
            <div class="chart-description mx-auto">
              Wins {{ role_data.win_loss.pct }}% of games
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="border-t dark:border-stone-700/50">
      <h2 class="font-sorts text-xl lg:text-2xl p-4 pt-6">
        Your Games
      </h2>
      <GameOverviewGrid :games="myGamesWithRole" />
    </section>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { Line, Pie } from "vue-chartjs";
import { chartColors } from "~/composables/useChartColors";

const route = useRoute();
const role_id = route.params.role_id as string;
const games = useGames();
const user = useUser();
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

const perScriptChartData = computed(() => {
  const map: Record<string, { labels: string[]; datasets: { data: number[]; hoverOffset: number; backgroundColor: string[] }[] }> = {};
  for (const script of role_data.popular_scripts) {
    map[script.script] = {
      labels: ["Win", "Loss"],
      datasets: [
        {
          data: [script.wins, script.count - script.wins],
          hoverOffset: 4,
          backgroundColor: [chartColors.win, chartColors.loss],
        },
      ],
    };
  }
  return map;
});

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

.script-list {
  .token {
    block-size: 7rem;
    inline-size: 7rem;
  }

  .script-chart {
    inset: -0.5rem;
  }
}

.chart-description {
  @apply text-sm text-center text-balance text-stone-800 dark:text-stone-300 max-w-44;
}

.role-link::after {
  content: "";
  inset: 0;
  position: absolute;
  z-index: 99;
}
</style>

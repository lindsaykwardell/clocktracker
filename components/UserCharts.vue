<template>
  <div class="px-4 lg:px-8 pb-4 lg:pb-8 space-y-8 md:space-y-12 xl:space-y-16">
    <div class="flex flex-col md:flex-row gap-3 px-4">
      <label class="flex gap-2 items-center">
        <span class="block whitespace-nowrap w-20 md:w-auto">Tags</span>
        <Input mode="select" v-model="selectedTag">
          <option :value="null">Filter by tag</option>
          <option
            v-for="tag in allTags.filter((tag) => !selectedTags.includes(tag))"
            :key="tag"
          >
            {{ tag }}
          </option>
        </Input>
      </label>
      <div class="flex flex-wrap gap-2 flex-grow">
        <Button
          v-for="(tag, index) in selectedTags"
          class="px-2 gap-0"
          @click.prevent="selectedTags.splice(index, 1)"
          :title="`Remove ${tag} tag`"
        >
          {{ tag }}<IconUI id="x" />
        </Button>
      </div>
    </div>

    <template v-if="games.status === Status.LOADING"> <Loading /> </template>
    <template v-else-if="games.status === Status.ERROR">
      Error loading games
    </template>
    <template v-else-if="games.status === Status.SUCCESS">
      <!-- <GamesOverTime
        :games="filteredGames"
        class="h-[250px] w-screen md:w-3/5"
      /> -->

      <!-- Fixed charts zone player -->
      <StatsPlayerHighlights
        v-if="mode === 'player'"
        :games="filteredGames"
        class="w-full xl:w-3/4 xl:mx-auto"
      />

      <StatsPlayerMostPlayed
        v-if="mode === 'player'"
        :games="filteredGames"
        class="w-full xl:w-3/4 xl:mx-auto"
      />

      <!-- Fixed charts zone Storyteller -->
      <StatsStorytellerHighlights
        v-if="mode === 'storyteller'"
        :games="filteredGames"
        :username="username"
        class="w-full xl:w-3/4 xl:mx-auto"
      />

      <div
        v-if="mode === 'storyteller'"
        class="w-full xl:w-3/4 xl:mx-auto grid grid-cols-4 lg:grid-cols-5 gap-x-2 md:gap-x-4 gap-y-8 md:gap-y-12 gap-y-16"
      >
        <div class="col-span-4 lg:col-span-2 grid grid-cols-subgrid">
          <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-4 lg:col-span-2">
            Game Size
          </h2>
          
          <div class="col-span-4 lg:col-span-2 grid grid-cols-subgrid">
            <StatsStorytellerPlayercount
              :games="filteredGames"
              :username="username"
              class="col-span-2 lg:col-span-1"
            />

            <StatsStorytellerMinioncount
              :games="filteredGames"
              :username="username"
              class="col-span-2 lg:col-span-1"
            />
          </div>
          
        </div>
        
        <div class="col-span-4 lg:col-span-3 grid grid-cols-subgrid">
          <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-4 lg:col-span-3">
            Scripts Storytold
          </h2>

          <div class="col-span-4 lg:col-span-3 grid grid-cols-subgrid">
            <StatsStorytellerScriptTypes
              :games="filteredGames"
              :username="username"
              class="col-span-2 lg:col-span-1"
            />

            <StatsStorytellerTopScripts
              :games="filteredGames"
              :username="username"
              class="col-span-2"
            />
          </div>
        </div>
        
      </div>

      <!-- Custom charts zone -->
      <div class="w-full xl:w-3/4 xl:mx-auto">
        <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
          Custom Charts
        </h2>
        <div class="flex flex-col items-center gap-12 m-auto p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40">
          <div class="flex flex-col items-center justify-center sm:flex-row flex-wrap gap-y-12">
            <Chart
              v-for="chart in chartsForMode"
              :key="chart.id"
              :games="filteredGames"
              :options="chart"
              :showControls="isMe"
              :username="username"
              @deleteChart="deleteChart"
              class="m-4"
            />
          </div>
          <Button
            component="nuxt-link"
            v-if="isMe"
            :to="addChartLink"
            primary
            font-size="md"
            class="px-3 py-2 mb-2 md:mb-0 inline-flex"
          >
            Add Chart
          </Button>
        </div>
      </div> 
    </template>

    <!-- Bottom stats player -->
    <!-- @todo Should this use games or filteredGames? -->
    <section>
      <UserRoles
        v-if="mode === 'player'"
        :games="games"
      />
    </section>
    
    <!-- Bottom stats Storyteller -->
    <StatsStorytellerBags
      v-if="mode === 'storyteller'"
      :games="filteredGames"
      :username="username"
      class="w-full xl:w-3/4 xl:mx-auto mb-12 md:mb-16"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
  username: string;
  mode?: "player" | "storyteller";
}>();

const users = useUsers();
const roles = useRoles();
const allGames = useGames();
const me = useSupabaseUser();
const mode = computed(() => props.mode ?? "player");

const user = computed(() => {
  return users.getUser(props.username);
});

const isMe = computed(() => {
  return (
    (user.value.status === Status.SUCCESS &&
      me.value &&
      me.value.id === user.value.data.user_id) ??
    false
  );
});

const allTags = computed(() => {
  if (user.value?.status === Status.SUCCESS) {
    return allGames.getTagsByPlayer(user.value.data.username);
  } else {
    return [];
  }
});

const allCharts = computed(() => {
  if (user.value?.status === Status.SUCCESS) {
    return user.value.data.charts;
  } else {
    return [];
  }
});

const chartsForMode = computed(() => {
  if (!allCharts.value.length) return [];

  if (mode.value === "storyteller") {
    return allCharts.value.filter((chart) => chart.storyteller_only);
  }

  return allCharts.value.filter((chart) => !chart.storyteller_only);
});

const addChartLink = computed(() => {
  if (mode.value === "storyteller") {
    return { path: "/charts/editor", query: { storyteller_only: "1" } };
  }

  return { path: "/charts/editor" };
});

const selectedTag = ref<string | null>(null);
const selectedTags = ref<string[]>([]);

watchEffect(() => {
  if (selectedTag.value) {
    selectedTags.value.push(selectedTag.value);
    selectedTag.value = null;
  }
});

const filteredGames = computed(() => {
  if (props.games.status !== Status.SUCCESS) {
    return [];
  }

  return props.games.data.filter(
    (game) =>
      !selectedTags.value.length ||
      selectedTags.value.every((tag) => game.tags.includes(tag))
  );
});

async function deleteChart(chartId: number) {
  if (confirm("Are you sure you want to delete this chart?")) {
    await $fetch(`/api/charts/${chartId}`, {
      method: "DELETE",
    });

    users.fetchUser(props.username);
  }
}

onMounted(() => {
  const lastSelectedTags = localStorage.getItem("lastSelectedTags");
  if (lastSelectedTags) {
    selectedTags.value = JSON.parse(lastSelectedTags);
  }

  roles.fetchRoles();
});

watch(
  () => selectedTags.value,
  (value) => {
    localStorage.setItem("lastSelectedTags", JSON.stringify(value));
  },
  { deep: true }
);
</script>

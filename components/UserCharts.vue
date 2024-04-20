<template>
  <template v-if="allGamesAreLoaded">
    <div>
      <div class="flex flex-col md:flex-row gap-3 px-4">
        <label class="flex gap-2 items-center">
          <span class="block whitespace-nowrap w-20 md:w-auto">Tags</span>
          <select
            v-model="selectedTag"
            class="w-full rounded p-1 text-lg bg-stone-600"
          >
            <option :value="null">Filter by tag</option>
            <option
              v-for="tag in allTags.filter(
                (tag) => !selectedTags.includes(tag)
              )"
              :key="tag"
            >
              {{ tag }}
            </option>
          </select>
        </label>
        <div class="flex flex-wrap gap-2 flex-grow">
          <button
            v-for="(tag, index) in selectedTags"
            class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded flex items-center gap-2"
            @click.prevent="selectedTags.splice(index, 1)"
          >
            {{ tag }}
          </button>
        </div>
        <Button
          component="nuxt-link"
          v-if="isMe"
          to="/charts/editor"
          primary
          font-size="md"
          class="px-3 py-2 mb-2 md:mb-0"
        >
          Add Chart
        </Button>
      </div>
      <div
        class="flex flex-col items-center justify-center sm:flex-row flex-wrap gap-y-12"
      >
        <template v-if="games.status === Status.LOADING"> Loading... </template>
        <template v-else-if="games.status === Status.ERROR">
          Error loading games
        </template>
        <template v-else-if="games.status === Status.SUCCESS">
          <GamesOverTime
            :games="filteredGames"
            class="h-[250px] w-screen md:w-3/5"
          />
          <TopCharacters
            :games="filteredGames"
            class="sm:w-1/2 md:w-2/5 pl-4"
          />
          <Chart
            v-for="chart in allCharts"
            :games="filteredGames"
            :options="chart"
            :showControls="isMe"
            @deleteChart="deleteChart"
            class="m-4"
          />
        </template>
      </div>
      <!-- Hack, I'm sorry future me -->
      <div class="h-[30px]">&nbsp;</div>
    </div>
  </template>
  <template v-else>
    <div class="flex justify-center items-center py-6 w-full">
      <Loading />
    </div>
  </template>
</template>

<script setup lang="ts">
const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
  username: string;
}>();

const users = useUsers();
const allGames = useGames();
const me = useSupabaseUser();

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

const allGamesAreLoaded = computed(() => {
  const count = allGames.players.get(props.username);
  if (
    count?.status !== Status.SUCCESS ||
    props.games.status !== Status.SUCCESS
  ) {
    return false;
  }

  return count.data === props.games.data.length;
});

const allGamesCount = computed(() => {
  const count = allGames.players.get(props.username);
  if (count?.status !== Status.SUCCESS) {
    return 1000;
  } else {
    return count.data;
  }
});

watchEffect(() => {
  if (!allGamesAreLoaded.value) {
    if (props.games.status === Status.SUCCESS) {
      allGames.fetchPlayerGames(props.username, {
        skip: 0,
        take: allGamesCount.value,
      });
    } else {
      allGames.fetchPlayerGames(props.username);
    }
  }
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
});

watch(
  () => selectedTags.value,
  (value) => {
    localStorage.setItem("lastSelectedTags", JSON.stringify(value));
  },
  { deep: true }
);
</script>

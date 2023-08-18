<template>
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
            v-for="tag in myTags.filter((tag) => !selectedTags.includes(tag))"
            :key="tag"
          >
            {{ tag }}
          </option>
        </select>
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(tag, index) in selectedTags"
          class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded flex items-center gap-2"
          @click.prevent="selectedTags.splice(index, 1)"
        >
          {{ tag }}
        </button>
      </div>
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
        <TopCharacters :games="filteredGames" class="sm:w-1/2 md:w-2/5 pl-4" />
        <WinRateByRole
          :games="filteredGames"
          class="h-[250px] w-screen md:w-1/3"
        />
        <RoleType :games="filteredGames" class="h-[250px] w-screen md:w-1/3" />
      </template>
    </div>
    <!-- Hack, I'm sorry future me -->
    <div class="h-[30px]">&nbsp;</div>
  </div>
</template>

<script setup lang="ts">
import { FetchStatus } from "composables/useFetchStatus";
import { GameRecord } from "composables/useGames";

const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
}>();

const user = useSupabaseUser();
const users = useUsers();
const allGames = useGames();

const me = computed(() => {
  if (user.value) {
    return users.getUserById(user.value.id);
  }
  return null;
});

const myTags = computed(() => {
  if (me.value?.status === Status.SUCCESS) {
    return allGames.getTagsByPlayer(me.value.data.username);
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

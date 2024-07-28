<template>
  <div>
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
          class="px-2"
          @click.prevent="selectedTags.splice(index, 1)"
        >
          {{ tag }}
        </Button>
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
        <TopCharacters :games="filteredGames" class="sm:w-1/2 md:w-2/5 pl-4" />

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
    <div class="grid lg:grid-cols-6 gap-3 p-4">
      <div
        v-for="roleGroup in allRoles"
        :class="{
          'col-span-1': roleGroup.name !== 'Townsfolk',
          'lg:col-span-2': roleGroup.name === 'Townsfolk',
        }"
      >
        <h3 class="font-dumbledor text-2xl text-center">
          {{ roleGroup.name }}
        </h3>
        <ul class="flex flex-wrap justify-center gap-1">
          <li v-for="role in roleGroup.roles">
            <nuxt-link :to="`/roles/${role.id}`">
              <div class="relative">
                <div
                  v-if="!characterIsPlayed(role.id)"
                  class="absolute top-0 left-0 bg-stone-800/75 rounded-full aspect-square w-full h-full z-10"
                  v-tooltip="`${role.name}`"
                />
                <Token
                  :character="{
                    role: role,
                    alignment: role.initial_alignment,
                  }"
                  size="sm"
                  v-tooltip="`${role.name}`"
                />
              </div>
            </nuxt-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
  username: string;
}>();

const users = useUsers();
const roles = useRoles();
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

const allPlayedCharacters = computed(() => {
  if (props.games.status !== Status.SUCCESS) {
    return [];
  }

  return props.games.data
    .filter((game) => !game.ignore_for_stats)
    .flatMap((game) => game.player_characters)
    .filter((character) => character.name);
});

const characterIsPlayed = computed(
  () => (role_id: string) =>
    allPlayedCharacters.value.some((character) => character.role_id === role_id)
);

const townsfolk = computed(() => {
  return roles.getRoleByType(RoleType.TOWNSFOLK);
});

const outsiders = computed(() => {
  return roles.getRoleByType(RoleType.OUTSIDER);
});

const minions = computed(() => {
  return roles.getRoleByType(RoleType.MINION);
});

const demons = computed(() => {
  return roles.getRoleByType(RoleType.DEMON);
});

const travelers = computed(() => {
  return roles.getRoleByType(RoleType.TRAVELER);
});

const allRoles = computed(() => {
  return [
    { name: "Townsfolk", roles: townsfolk.value },
    { name: "Outsiders", roles: outsiders.value },
    { name: "Minions", roles: minions.value },
    { name: "Demons", roles: demons.value },
    { name: "Travelers", roles: travelers.value },
  ];
});

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

<template>
  <div class="px-4 lg:px-8 pb-4 lg:pb-8 space-y-8 md:space-y-12 xl:space-y-16">
    <div
      v-if="games.status === Status.SUCCESS"
      class="flex flex-col gap-3 px-4"
    >
      <div class="flex flex-col lg:flex-row gap-3 justify-between">
        <div class="flex flex-col md:flex-row gap-3 px-4">
          <div class="relative w-full md:w-auto">
            <Menu>
              <MenuButton class="relative w-full md:w-auto">
                <span
                  v-if="activeFilters.length"
                  class="absolute -top-2 -right-2 text-stone-200 bg-red-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
                  aria-label="Active filters"
                >
                  {{ activeFilters.length }}
                </span>
                <Button 
                  icon="filter"
                >
                  Filter Stats
                </Button>
              </MenuButton>
              <transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-out"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <MenuItems
                  class="absolute top-[100%] left-0 md:right-0 md:left-auto lg:right-auto lg:left-0 z-20 bg-stone-950 p-2 rounded shadow-md whitespace-nowrap flex flex-col gap-2 items-start w-full md:w-[355px]"
                >
                  <MenuItem>
                    <div class="flex gap-2 items-center">
                      <span class="flex-shrink text-stone-200">Dates</span>
                      <Input
                        @click.stop
                        type="date"
                        v-model="startDateRange"
                        aria-label="After Date"
                        class="h-[32px] text-sm flex-grow text-black dark:text-white"
                        v-tooltip="'After Date'"
                      />
                      <Input
                        @click.stop
                        type="date"
                        v-model="endDateRange"
                        aria-label="Before Date"
                        class="h-[32px] text-sm flex-grow text-black dark:text-white"
                        v-tooltip="'Before Date'"
                      />
                    </div>
                  </MenuItem>
                  <MenuItem>
                    <div class="flex gap-2 items-center text-stone-200">
                      Player Count
                      <Input
                        @click.stop
                        type="number"
                        v-model="minPlayers"
                        min="0"
                        placeholder="Min"
                        aria-label="Min Players"
                        class="h-[32px] text-sm text-black dark:text-white"
                        v-tooltip="'Min Players'"
                      />
                      <Input
                        @click.stop
                        type="number"
                        v-model="maxPlayers"
                        max="25"
                        placeholder="Max"
                        aria-label="Max Players"
                        class="h-[32px] text-sm text-black dark:text-white"
                        v-tooltip="'Max Players'"
                      />
                    </div>
                  </MenuItem>
                  <MenuItem v-if="availableCommunities.length">
                    <label class="w-full">
                      <select
                        v-model="selectedCommunity"
                        @click.stop
                        class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                        aria-label="Community"
                      >
                        <option :value="null">Filter by community</option>
                        <option
                          v-for="community in availableCommunities"
                          :key="community"
                        >
                          {{ community }}
                        </option>
                      </select>
                    </label>
                  </MenuItem>
                  <MenuItem v-if="availableLocations.length">
                    <label class="w-full">
                      <select
                        v-model="selectedLocation"
                        @click.stop
                        class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                        aria-label="Location"
                      >
                        <option :value="null">Filter by location</option>
                        <option
                          v-for="location in availableLocations"
                          :key="location"
                        >
                          {{ location }}
                        </option>
                      </select>
                    </label>
                  </MenuItem>
                  <MenuItem>
                    <label class="w-full">
                      <select
                        v-model="selectedTag"
                        @click.stop
                        class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                        aria-label="Tags"
                      >
                        <option :value="null">Filter by tag</option>
                        <option
                          v-for="tag in allTags.filter((tag) => !selectedTags.includes(tag))"
                          :key="tag"
                        >
                          {{ tag }}
                        </option>
                      </select>
                    </label>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <Button
            @click="setMode('player')"
            :disabled="mode === 'player'"
            icon="person"
          >
            Player
          </Button>

          <Button
            @click="setMode('storyteller')"
            :disabled="mode === 'storyteller'"
            icon="book"
          >
            Storyteller
          </Button>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 px-4">
        <Button
          v-if="startDateRange !== null"
          @click.prevent="startDateRange = null"
          :title="`Remove after ${formatDate(new Date(startDateRange))} date filter`"
          size="small"
          removableTag
        >
          From: {{ formatDate(new Date(startDateRange)) }}
        </Button>
        <Button
          v-if="endDateRange !== null"
          @click.prevent="endDateRange = null"
          :title="`Remove before ${formatDate(new Date(endDateRange))} date filter`"
          size="small"
          removableTag
        >
          To: {{ formatDate(new Date(endDateRange)) }}
        </Button>
        <Button
          v-if="minPlayers !== null"
          @click.prevent="minPlayers = null"
          :title="`Remove min ${minPlayers} playercount filter`"
          size="small"
          removableTag
        >
          Min Players: {{ minPlayers }}
        </Button>
        <Button
          v-if="maxPlayers !== null"
          @click.prevent="maxPlayers = null"
          :title="`Remove max ${maxPlayers} playercount filter `"
          size="small"
          removableTag
        >
          Max Players: {{ maxPlayers }}
        </Button>
        <Button
          v-if="selectedCommunity"
          @click.prevent="selectedCommunity = null"
          :title="`Remove ${selectedCommunity} community filter`"
          size="small"
          removableTag
        >
          Community: {{ selectedCommunity }}
        </Button>
        <Button
          v-if="selectedLocation"
          @click.prevent="selectedLocation = null"
          :title="`Remove ${selectedLocation} location filter`"
          size="small"
          removableTag
        >
          Location: {{ selectedLocation }}
        </Button>
        <Button
          v-for="(tag, index) in selectedTags"
          @click.prevent="selectedTags.splice(index, 1)"
          :title="`Remove ${tag} tag`"
          size="small"
          removableTag
        >
          Tag: {{ tag }}
        </Button>
      </div>
    </div>

    <template v-if="games.status === Status.LOADING"> <Loading /> </template>
    <template v-else-if="games.status === Status.ERROR">
      Error loading games
    </template>
    <template v-else-if="games.status === Status.SUCCESS">
      <!-- Highlights -->
      <section>
        <StatsPlayerHighlights
          v-if="mode === 'player'"
          :games="filteredGames"
          :is-me="isMe"
          :username="username"
          class="w-full xl:w-3/4 xl:mx-auto"
        />

        <StatsStorytellerHighlights
          v-if="mode === 'storyteller'"
          :games="filteredGames"
          :username="username"
          class="w-full xl:w-3/4 xl:mx-auto"
        />
      </section>

      <!-- Most played / Game Size + Scripts -->
      <section>
        <StatsPlayerMostPlayed
          v-if="mode === 'player'"
          :games="filteredGames"
          :is-me="isMe"
          class="w-full xl:w-3/4 xl:mx-auto"
        />

        <div
          v-if="mode === 'storyteller'"
          class="w-full xl:w-3/4 xl:mx-auto grid grid-cols-4 lg:grid-cols-5 gap-x-2 md:gap-x-4 gap-y-8 md:gap-y-12 xl:gap-y-16"
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
      </section>

      <!-- Player alignment -->
      <section>
        <StatsPlayerAlignment
          v-if="mode === 'player'"
          :games="filteredGames"
          :is-me="isMe"
          class="w-full xl:w-3/4 xl:mx-auto"
        />
      </section>
      
      <!-- Games over time -->
      <section>
        <StatsPlayerGamesOverTime
          v-if="mode === 'player'"
          :games="filteredGames"
          :is-me="isMe"
          class="w-full xl:w-3/4 xl:mx-auto"
        />

        <StatsStorytellerGamesOverTime
          v-if="mode === 'storyteller'"
          :games="filteredGames"
          :is-me="isMe"
          :username="username"
          class="w-full xl:w-3/4 xl:mx-auto"
        />
      </section>

      <!-- Custom charts zone -->
      <section v-if="chartsForMode.length > 0 || isMe" class="w-full xl:w-3/4 xl:mx-auto">
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
            color="primary"
            icon="plus-lg"
            size="small"
            class="mb-2 md:mb-0 inline-flex"
          >
            Add Chart
          </Button>
        </div>
      </section>

      <section v-if="isMe">
        <StatsStorytellerBags
          v-if="mode === 'storyteller'"
          :games="filteredGames"
          :username="username"
          class="w-full xl:w-3/4 xl:mx-auto mb-12 md:mb-16"
        />
      </section>

      <!-- Roles list -->
      <!-- @todo Should this use games or filteredGames? -->
      <section>
        <StatsPlayerRoles
          v-if="mode === 'player'"
          :games="games"
        />

        <StatsStorytellerRoles
          v-if="mode === 'storyteller'"
          :games="games"
          :username="username"
        />
      </section>
    </template>    
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
  username: string;
}>();

const route = useRoute();
const router = useRouter();
const users = useUsers();
const roles = useRoles();
const allGames = useGames();
const me = useSupabaseUser();
const storytellerQuery = computed<string | undefined>(() => {
  const value = route.query.storyteller;
  return Array.isArray(value) ? value[0] : value ?? undefined;
});
const mode = ref<"player" | "storyteller">(
  storytellerQueryToMode(storytellerQuery.value)
);

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
const startDateRange = ref<string | null>(null);
const endDateRange = ref<string | null>(null);
const minPlayers = ref<string | null>(null);
const maxPlayers = ref<string | null>(null);
const selectedCommunity = ref<string | null>(null);
const selectedLocation = ref<string | null>(null);

const availableCommunities = computed(() => {
  if (user.value?.status === Status.SUCCESS) {
    return allGames.getCommunityNamesByPlayer(user.value.data.username);
  } else {
    return [];
  }
});

const availableLocations = computed(() => {
  if (props.games.status !== Status.SUCCESS) {
    return [];
  }

  return [
    ...new Set(
      props.games.data
        .filter((game) => game.location)
        .map((game) => game.location.trim())
    ),
  ].sort();
});

const activeFilters = computed(() => {
  return [
    ...selectedTags.value.map((tag) => ({ type: "tag", value: tag })),
    ...(startDateRange.value
      ? [{ type: "start_date", value: startDateRange.value }]
      : []),
    ...(endDateRange.value
      ? [{ type: "end_date", value: endDateRange.value }]
      : []),
    ...(minPlayers.value ? [{ type: "min_players", value: minPlayers.value }] : []),
    ...(maxPlayers.value ? [{ type: "max_players", value: maxPlayers.value }] : []),
    ...(selectedCommunity.value
      ? [{ type: "community", value: selectedCommunity.value }]
      : []),
    ...(selectedLocation.value
      ? [{ type: "location", value: selectedLocation.value }]
      : []),
  ];
});

watchEffect(() => {
  if (selectedTag.value) {
    selectedTags.value.push(selectedTag.value);
    selectedTag.value = null;
  }
});

watchEffect(() => {
  if (minPlayers.value === "") {
    minPlayers.value = null;
  }
});

watchEffect(() => {
  if (maxPlayers.value === "") {
    maxPlayers.value = null;
  }
});

watchEffect(() => {
  if (startDateRange.value === "") {
    startDateRange.value = null;
  }
});

watchEffect(() => {
  if (endDateRange.value === "") {
    endDateRange.value = null;
  }
});

const filteredGames = computed(() => {
  if (props.games.status !== Status.SUCCESS) {
    return [];
  }

  return props.games.data.filter(
    (game) => {
      const playerCount = game.player_count ?? 0;

      return (
        (!selectedTags.value.length ||
          selectedTags.value.every((tag) => game.tags.includes(tag))) &&
        (!startDateRange.value ||
          new Date(game.date) >= new Date(startDateRange.value)) &&
        (!endDateRange.value ||
          new Date(game.date) <= new Date(endDateRange.value)) &&
        (minPlayers.value === null || playerCount >= +minPlayers.value) &&
        (maxPlayers.value === null || playerCount <= +maxPlayers.value) &&
        (!selectedCommunity.value ||
          game.community_name?.trim() === selectedCommunity.value.trim()) &&
        (!selectedLocation.value ||
          game.location?.trim() === selectedLocation.value.trim())
      );
    }
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
  const savedFilters = localStorage.getItem("charts__filters");
  if (savedFilters) {
    try {
      const parsedFilters = JSON.parse(savedFilters);
      if (parsedFilters.selectedTags) {
        selectedTags.value = parsedFilters.selectedTags;
      }
      if (parsedFilters.startDateRange) {
        startDateRange.value = parsedFilters.startDateRange;
      }
      if (parsedFilters.endDateRange) {
        endDateRange.value = parsedFilters.endDateRange;
      }
      if (parsedFilters.minPlayers !== undefined) {
        minPlayers.value = parsedFilters.minPlayers;
      }
      if (parsedFilters.maxPlayers !== undefined) {
        maxPlayers.value = parsedFilters.maxPlayers;
      }
      if (parsedFilters.selectedCommunity) {
        selectedCommunity.value = parsedFilters.selectedCommunity;
      }
      if (parsedFilters.selectedLocation) {
        selectedLocation.value = parsedFilters.selectedLocation;
      }
    } catch (e) {
      console.error("Failed to parse saved filters", e);
    }
  } else {
    const lastSelectedTags = localStorage.getItem("lastSelectedTags");
    if (lastSelectedTags) {
      selectedTags.value = JSON.parse(lastSelectedTags);
    }
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

watch(
  () => ({
    selectedTags: selectedTags.value,
    startDateRange: startDateRange.value,
    endDateRange: endDateRange.value,
    minPlayers: minPlayers.value,
    maxPlayers: maxPlayers.value,
    selectedCommunity: selectedCommunity.value,
    selectedLocation: selectedLocation.value,
  }),
  (value) => {
    localStorage.setItem("charts__filters", JSON.stringify(value));
  },
  { deep: true }
);

watch(storytellerQuery, (value) => {
  const nextMode = storytellerQueryToMode(value);
  if (mode.value !== nextMode) {
    mode.value = nextMode;
  }
});

watch(mode, (value) => {
  const storytellerParam = value === "storyteller" ? "1" : undefined;

  if (storytellerQuery.value === storytellerParam) {
    return;
  }

  const nextQuery = { ...route.query };

  if (storytellerParam) {
    nextQuery.storyteller = storytellerParam;
  } else {
    delete nextQuery.storyteller;
  }

  router.replace({ query: nextQuery });
});

function storytellerQueryToMode(
  value: string | undefined
): "player" | "storyteller" {
  return value === "1" || value === "true" || value === "storyteller"
    ? "storyteller"
    : "player";
}

function setMode(nextMode: "player" | "storyteller") {
  if (mode.value !== nextMode) {
    mode.value = nextMode;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language, {
    timeZone: "UTC",
  }).format(new Date(date));
}
</script>

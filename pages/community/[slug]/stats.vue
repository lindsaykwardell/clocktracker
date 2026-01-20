<template>
  <CommunityTemplate>
    <template #default>
      <div class="px-4 lg:px-8 pb-4 lg:pb-8 space-y-8 md:space-y-12 xl:space-y-16">
        <template v-if="pending">
          <Loading />
        </template>
        <template v-else-if="error">
          Error loading stats.
        </template>
        <template v-else-if="!stats?.games?.length || stats?.players.length === 0 || !filteredGames.length">
          No stats available.
        </template>
        <template v-else>
          <div class="flex flex-col gap-3 px-4">
            <div class="flex flex-col lg:flex-row gap-3 justify-between">
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
              <div class="flex items-center gap-2 px-2">
                <input
                  id="include-non-members"
                  type="checkbox"
                  v-model="includeNonMembers"
                  class="h-4 w-4"
                />
                <label for="include-non-members" class="text-sm">
                  Include non-community members
                </label>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button
                v-if="startDateRange !== null"
                @click.prevent="startDateRange = null"
                :title="`Remove after ${formatDate(new Date(startDateRange))} date filter`"
                size="sm"
                removableTag
              >
                From: {{ formatDate(new Date(startDateRange)) }}
              </Button>
              <Button
                v-if="endDateRange !== null"
                @click.prevent="endDateRange = null"
                :title="`Remove before ${formatDate(new Date(endDateRange))} date filter`"
                size="sm"
                removableTag
              >
                To: {{ formatDate(new Date(endDateRange)) }}
              </Button>
              <Button
                v-if="minPlayers !== null"
                @click.prevent="minPlayers = null"
                :title="`Remove min ${minPlayers} playercount filter`"
                size="sm"
                removableTag
              >
                Min Players: {{ minPlayers }}
              </Button>
              <Button
                v-if="maxPlayers !== null"
                @click.prevent="maxPlayers = null"
                :title="`Remove max ${maxPlayers} playercount filter `"
                size="sm"
                removableTag
              >
                Max Players: {{ maxPlayers }}
              </Button>
              <Button
                v-if="selectedLocation"
                @click.prevent="selectedLocation = null"
                :title="`Remove ${selectedLocation} location filter`"
                size="sm"
                removableTag
              >
                Location: {{ selectedLocation }}
              </Button>
              <Button
                v-for="(tag, index) in selectedTags"
                @click.prevent="selectedTags.splice(index, 1)"
                :title="`Remove ${tag} tag`"
                size="sm"
                removableTag
              >
                Tag: {{ tag }}
              </Button>
            </div>
          </div>

          <section v-if="filteredGames.length">
            <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
              Community Standouts
            </h2>
            <div class="w-full xl:w-3/4 xl:mx-auto grid gap-x-2 md:gap-x-4 gap-y-8 md:gap-y-12 xl:gap-y-16 community-grid-8">
              <StatsCommunityTopPlayers
                :players="visiblePlayers"
                mode="players"
                title="Most Frequent Players"
                class="col-span-3"
              />
              <StatsCommunityTopPlayers
                :players="visiblePlayers"
                mode="storytellers"
                title="Most Frequent Storytellers"
                class="col-span-3"
              />
              <StatsCommunityTopLocations
                :games="filteredGames"
                :is-member="isMember"
                class="col-span-2"
              />
            </div>
          </section>

          <section>
            <StatsCommunityHighlights 
              :players="visiblePlayers"
              :games="filteredGames"
              class="w-full xl:w-3/4 xl:mx-auto"
            />
          </section>
          
          <section>
            <StatsCommunityOutsiderHighlights 
              :players="visiblePlayers"
              class="w-full xl:w-3/4 xl:mx-auto"
            />
          </section>

          <section v-if="filteredGames.length">
            <StatsCommunityAlignment
              :games="{ status: Status.SUCCESS, data: filteredGames }"
              :players="visiblePlayers"
              class="w-full xl:w-3/4 xl:mx-auto"
            />
          </section>

          <section v-if="filteredGames.length">
            <StatsCommunityGamesOverTime 
              :games="filteredGames" 
              class="w-full xl:w-3/4 xl:mx-auto"
            />
          </section>

          <section v-if="filteredGames.length">
            <div class="w-full xl:w-3/4 xl:mx-auto grid grid-cols-4 lg:grid-cols-5 gap-x-2 md:gap-x-4 gap-y-8 md:gap-y-12 xl:gap-y-16">
              <div class="col-span-4 lg:col-span-2 grid grid-cols-subgrid">
                <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-4 lg:col-span-2">
                  Game Size
                </h2>
                
                <div class="col-span-4 lg:col-span-2 grid grid-cols-subgrid">
                  <StatsCommunityPlayercount 
                    :games="filteredGames"
                    class="col-span-2 lg:col-span-1"
                  />
                  <StatsCommunityMinioncount 
                    :games="filteredGames"
                    class="col-span-2 lg:col-span-1"
                  />
                </div>
                
              </div>
              
              <div class="col-span-4 lg:col-span-3 grid grid-cols-subgrid">
                <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-4 lg:col-span-3">
                  Scripts played
                </h2>

                <div class="col-span-4 lg:col-span-3 grid grid-cols-subgrid">
                  <StatsCommunityScriptTypes
                    :games="filteredGames"
                    class="col-span-2 lg:col-span-1"
                  />

                  <StatsCommunityTopScripts 
                    :games="filteredGames" 
                    class="col-span-2"
                  />
                </div>
              </div>
            </div>
          </section>

          <section v-if="filteredGames.length">
            <StatsCommunityMembers
              :players="visiblePlayers"
              :member-ids="communityMembers"
              class="w-full xl:w-3/4 xl:mx-auto"
            />
          </section>

          <section v-if="filteredGames.length">
            <StatsCommunityRoles :games="{ status: Status.SUCCESS, data: filteredGames }" :players="visiblePlayers" />
          </section>

        </template>

        <div v-if="stats && stats.players.length" class="mt-2 text-sm">
          <p class="text-stone-500">
            Totals: {{ stats.totals.games }} games • {{ stats.totals.players }} players seen in grimoire tokens
          </p>
        </div>
      </div>
    </template>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, resolveComponent, watchEffect } from "vue";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { Status } from "~/composables/useFetchStatus";
import type { GameRecord } from "~/composables/useGames";
type PlayerSummary = {
  user_id: string | null;
  username: string;
  avatar: string | null;
  priority?: number;
  plays: number;
  wins: number;
  losses: number;
  good_plays: number;
  evil_plays: number;
  traveler_plays: number;
  storyteller_plays: number;
  drunk_plays: number;
  lunatic_plays: number;
  mutant_plays: number;
  damsel_plays: number;
  role_details: Record<
    string,
    { token_url: string | null; type: string | null; initial_alignment: string | null }
  >;
  role_tokens: Record<string, string | null>;
  role_games: Record<string, string[]>;
  roles: Record<string, number>;
};

type CommunityStats = {
  totals: { games: number; players: number };
  players: PlayerSummary[];
  games: GameRecord[];
};

const route = useRoute();
const slug = route.params.slug as string;
const communities = useCommunities();
const user = useSupabaseUser();
const metadata = await $fetch(`/api/community/${slug}/minimal`);

const { data: stats, pending, error } = useFetch<CommunityStats>(
  () => `/api/community/${slug}/stats`
);

const statsGames = computed(() => stats.value?.games ?? []);
const isMember = computed(() => communities.isMember(slug, user.value?.id));
const communityMembers = computed(() => {
  const community = communities.getCommunity(slug);
  if (community.status !== Status.SUCCESS) return [];
  return community.data.members.map((m) => m.user_id);
});

const startDateRange = ref<string | null>(null);
const endDateRange = ref<string | null>(null);
const minPlayers = ref<number | null>(null);
const maxPlayers = ref<number | null>(null);
const selectedLocation = ref<string | null>(null);
const selectedTag = ref<string | null>(null);
const selectedTags = ref<string[]>([]);
const includeNonMembers = ref(true);

const allTags = computed(() => {
  if (!statsGames.value.length) return [];
  const set = new Set<string>();
  statsGames.value.forEach((game) => {
    for (const tag of game.tags || []) {
      set.add(tag);
    }
  });
  return Array.from(set).sort();
});

const availableLocations = computed(() => {
  if (!statsGames.value.length) return [];
  return [
    ...new Set(
      statsGames.value
        .filter((game) => game.location)
        .map((game) => game.location!.trim())
    ),
  ].sort();
});

const activeFilters = computed(() => {
  return [
    ...selectedTags.value.map((tag) => ({ type: "tag", value: tag })),
    ...(startDateRange.value ? [{ type: "start_date", value: startDateRange.value }] : []),
    ...(endDateRange.value ? [{ type: "end_date", value: endDateRange.value }] : []),
    ...(minPlayers.value ? [{ type: "min_players", value: minPlayers.value }] : []),
    ...(maxPlayers.value ? [{ type: "max_players", value: maxPlayers.value }] : []),
    ...(selectedLocation.value ? [{ type: "location", value: selectedLocation.value }] : []),
    ...(includeNonMembers.value ? [] : [{ type: "members_only", value: "true" }]),
  ];
});

watchEffect(() => {
  if (selectedTag.value) {
    selectedTags.value.push(selectedTag.value);
    selectedTag.value = null;
  }
});

watchEffect(() => {
  if (minPlayers.value === "") minPlayers.value = null;
  if (maxPlayers.value === "") maxPlayers.value = null;
  if (startDateRange.value === "") startDateRange.value = null;
  if (endDateRange.value === "") endDateRange.value = null;
});

const filteredGames = computed<GameRecord[]>(() => {
  if (!statsGames.value.length) return [];
  return statsGames.value.filter((game) => {
    const playerCount = game.player_count ?? 0;
    return (
      (!selectedTags.value.length ||
        selectedTags.value.every((tag) => (game.tags ?? []).includes(tag))) &&
      (!startDateRange.value || new Date(game.date) >= new Date(startDateRange.value)) &&
      (!endDateRange.value || new Date(game.date) <= new Date(endDateRange.value)) &&
      (minPlayers.value === null || playerCount >= +minPlayers.value) &&
      (maxPlayers.value === null || playerCount <= +maxPlayers.value) &&
      (!selectedLocation.value ||
        game.location?.trim() === selectedLocation.value.trim())
    );
  });
});

const visiblePlayers = computed(() => {
  if (!stats.value) return [];
  if (includeNonMembers.value) return stats.value.players;
  const memberSet = new Set(communityMembers.value);
  return stats.value.players.filter((p) => p.user_id && memberSet.has(p.user_id));
});

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language, {
    timeZone: "UTC",
  }).format(new Date(date));
}

const mostEvil = computed(() => pickTop("evil_plays"));
const mostWins = computed(() => pickTop("wins"));

function pickTop(key: keyof PlayerSummary) {
  if (!stats.value) return null;
  const players = stats.value.players
    .filter((p) => (p[key] as number) > 0)
    .sort((a, b) => (b[key] as number) - (a[key] as number));

  return players[0] || null;
}

function playerLink(player: PlayerSummary | null) {
  if (!player || !player.user_id) return null;
  return `/@${player.username}`;
}

const NuxtLink = resolveComponent("nuxt-link");

const DebugLinks = defineComponent({
  name: "DebugLinks",
  props: {
    games: { type: Array as () => string[], default: () => [] },
  },
  setup(props) {
    return () =>
      props.games.length
        ? h(
            "div",
            {
              class:
                "text-xs text-stone-500 flex flex-wrap gap-2 justify-center mt-1",
            },
            props.games.map((gameId) =>
              h(
                NuxtLink,
                {
                  to: `/game/${gameId}`,
                  class: "underline text-primary",
                },
                { default: () => `Game ${gameId}` }
              )
            )
          )
        : null;
  },
});

useHead({
  title: () => `Stats - ${metadata.name}`,
});

</script>

<style scoped>
  .community-grid-8 {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
</style>

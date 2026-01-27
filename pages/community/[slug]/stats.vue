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
                    <Button
                      icon="filter"
                      :count="activeFilters.length ? activeFilters.length : ''"
                      countLabel="Active filters"
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
            <div class="w-full xl:w-3/4 xl:mx-auto grid gap-2 md:gap-4 community-grid-8">
              <StatsCommunityTopPlayers
                :players="visiblePlayers"
                mode="players"
                title="Most Frequent Players"
                class="col-span-3"
                :anonymize-non-users="!isMember"
              />
              <StatsCommunityTopPlayers
                :players="visiblePlayers"
                mode="storytellers"
                title="Most Frequent Storytellers"
                class="col-span-3"
                :anonymize-non-users="!isMember"
              />
              <StatsCommunityTopLocations
                :games="filteredGames"
                :is-member="isMember"
                class="col-span-3 lg:col-span-2"
              />
            </div>
          </section>

          <section>
            <StatsCommunityHighlights 
              :players="visiblePlayers"
              :games="filteredGames"
              class="w-full xl:w-3/4 xl:mx-auto"
              :anonymize-non-users="!isMember"
            />
          </section>
          
          <section>
            <StatsCommunityOutsiderHighlights 
              :players="visiblePlayers"
              class="w-full xl:w-3/4 xl:mx-auto"
              :anonymize-non-users="!isMember"
            />
          </section>

          <section v-if="filteredGames.length">
            <StatsCommunityAlignment
              :games="{ status: Status.SUCCESS, data: filteredGames }"
              :players="visiblePlayers"
              class="w-full xl:w-3/4 xl:mx-auto"
              :anonymize-non-users="!isMember"
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
              :anonymize-non-users="!isMember"
            />
          </section>

          <section v-if="filteredGames.length">
            <StatsCommunityRoles
              :games="{ status: Status.SUCCESS, data: filteredGames }"
              :players="visiblePlayers"
              :anonymize-non-users="!isMember"
            />
          </section>
        </template>
      </div>
    </template>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, resolveComponent, watchEffect } from "vue";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { Status } from "~/composables/useFetchStatus";
import type { GameRecord } from "~/composables/useGames";
import { WinStatus_V2 } from "~/composables/useGames";
type PlayerSummary = {
  user_id: string | null;
  username: string;
  display_name?: string;
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

type CommunityToken = {
  alignment: string | null;
  role: {
    name: string;
    type: string | null;
    initial_alignment: string | null;
    token_url: string | null;
  } | null;
  player: {
    user_id: string | null;
    username: string | null;
    display_name: string | null;
    avatar: string | null;
  } | null;
  player_name: string | null;
};

type CommunityGame = Omit<GameRecord, "grimoire" | "user"> & {
  user: {
    user_id: string;
    username: string;
    avatar: string | null;
  } | null;
  storyteller: string | null;
  co_storytellers: (string | null)[] | null;
  is_storyteller: boolean | null;
  grimoire: { tokens: CommunityToken[] }[];
};

type CommunityStats = {
  totals: { games: number; players: number };
  players: PlayerSummary[];
  games: CommunityGame[];
};

const route = useRoute();
const slug = route.params.slug as string;
const communities = useCommunities();
const users = useUsers();
const user = useSupabaseUser();
const metadata = await $fetch(`/api/community/${slug}/minimal`);

const { data: stats, pending, error } = useFetch<CommunityStats>(
  () => `/api/community/${slug}/stats`
);

const statsGames = computed<CommunityGame[]>(() => stats.value?.games ?? []);
const isMember = computed(() => communities.isMember(slug, user.value?.id));
const communityMembers = computed(() => {
  const community = communities.getCommunity(slug);
  if (community.status !== Status.SUCCESS) return [];
  return community.data.members.map((m) => m.user_id);
});
const communityMemberSet = computed(() => new Set(communityMembers.value));
const communityMemberByUsername = computed(() => {
  const community = communities.getCommunity(slug);
  if (community.status !== Status.SUCCESS) {
    return new Map<
      string,
      {
        user_id: string;
        username: string;
        display_name: string;
        avatar: string | null;
      }
    >();
  }

  const map = new Map<
    string,
    {
      user_id: string;
      username: string;
      display_name: string;
      avatar: string | null;
    }
  >();

  for (const member of community.data.members) {
    if (!member?.username) continue;
    map.set(member.username.toLowerCase(), {
      user_id: member.user_id,
      username: member.username,
      display_name: member.display_name,
      avatar: member.avatar ?? null,
    });
  }

  return map;
});
const communityMemberById = computed(() => {
  const community = communities.getCommunity(slug);
  if (community.status !== Status.SUCCESS) {
    return new Map<string, { display_name: string; username: string; avatar: string | null }>();
  }

  const map = new Map<string, { display_name: string; username: string; avatar: string | null }>();
  for (const member of community.data.members) {
    map.set(member.user_id, {
      display_name: member.display_name,
      username: member.username,
      avatar: member.avatar ?? null,
    });
  }

  return map;
});
const fetchedUsernames = new Set<string>();
const getUserByUsername = (username: string) => {
  const trimmed = username.trim();
  if (!trimmed.startsWith("@")) {
    return null;
  }

  const normalized = trimmed.replace(/^@/, "");
  if (!normalized) return null;

  const status = users.getUser(normalized);
  if (status.status === Status.SUCCESS) {
    return status.data;
  }

  if (!process.server && status.status !== Status.LOADING) {
    if (!fetchedUsernames.has(normalized)) {
      fetchedUsernames.add(normalized);
      users.fetchUser(normalized);
    }
  }

  return null;
};

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
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
});

const availableLocations = computed(() => {
  if (!statsGames.value.length) return [];
  return [
    ...new Set(
      statsGames.value
        .filter((game) => game.location)
        .map((game) => game.location!.trim())
    ),
  ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
});

const activeFilters = computed(() => {
  return [
    ...selectedTags.value.map((tag) => ({ type: "tag", value: tag })),
    ...(startDateRange.value ? [{ type: "start_date", value: startDateRange.value }] : []),
    ...(endDateRange.value ? [{ type: "end_date", value: endDateRange.value }] : []),
    ...(minPlayers.value ? [{ type: "min_players", value: minPlayers.value }] : []),
    ...(maxPlayers.value ? [{ type: "max_players", value: maxPlayers.value }] : []),
    ...(selectedLocation.value ? [{ type: "location", value: selectedLocation.value }] : []),
    // Membership toggle should not count as a filter badge.
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

const filteredGames = computed<CommunityGame[]>(() => {
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

const filteredPlayers = computed(() =>
  buildPlayerStats(
    filteredGames.value,
    communityMemberSet.value,
    communityMemberByUsername.value,
    communityMemberById.value
  )
);

const visiblePlayers = computed(() => {
  if (includeNonMembers.value) return filteredPlayers.value;
  const memberSet = communityMemberSet.value;
  return filteredPlayers.value.filter((p) => p.user_id && memberSet.has(p.user_id));
});

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language, {
    timeZone: "UTC",
  }).format(new Date(date));
}

function pickTop(key: keyof PlayerSummary) {
  if (!stats.value) return null;
  const players = stats.value.players
    .filter((p) => (p[key] as number) > 0)
    .sort((a, b) => (b[key] as number) - (a[key] as number));

  return players[0] || null;
}

const NuxtLink = resolveComponent("nuxt-link");

useHead({
  title: () => `Stats - ${metadata.name}`,
});

type PlayerIdentity = {
  key: string;
  user_id: string | null;
  username: string;
  display_name?: string;
  avatar: string | null;
};

type RoleDetails = {
  token_url: string | null;
  type: string | null;
  initial_alignment: string | null;
};

type Alignment = "GOOD" | "EVIL" | null;

type PlayerAccumulator = {
  identity: PlayerIdentity;
  alignment: Alignment;
  roles: Set<string>;
  roleTokens: Map<string, string | null>;
  travelerCount: number;
  isStoryteller: boolean;
  roleDetails: Map<string, RoleDetails>;
};

// Prefer display names for @username storytellers when we can match a member.
function resolveStorytellerIdentity(
  name: string,
  memberByUsername: Map<
    string,
    {
      user_id: string;
      username: string;
      display_name: string;
      avatar: string | null;
    }
  >,
  memberById: Map<string, { display_name: string; username: string; avatar: string | null }>
): PlayerIdentity {
  const trimmed = name.trim();
  const normalized = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  const member = memberByUsername.get(normalized.toLowerCase());

  if (member) {
    const memberByIdMatch = memberById.get(member.user_id);
    return {
      key: `user:${member.user_id}`,
      user_id: member.user_id,
      username: member.username,
      display_name:
        memberByIdMatch?.display_name ||
        member.display_name ||
        member.username,
      avatar: memberByIdMatch?.avatar ?? member.avatar ?? null,
    };
  }

  const fetchedUser = getUserByUsername(trimmed);
  if (fetchedUser) {
    return {
      key: `user:${fetchedUser.user_id}`,
      user_id: fetchedUser.user_id,
      username: fetchedUser.username,
      display_name: fetchedUser.display_name || fetchedUser.username,
      avatar: fetchedUser.avatar ?? null,
    };
  }

  return {
    key: `name:${normalized.toLowerCase()}`,
    user_id: null,
    username: normalized,
    display_name: normalized,
    avatar: null,
  };
}

function buildPlayerStats(
  games: CommunityGame[],
  memberIds: Set<string>,
  memberByUsername: Map<
    string,
    {
      user_id: string;
      username: string;
      display_name: string;
      avatar: string | null;
    }
  >,
  memberById: Map<string, { display_name: string; username: string; avatar: string | null }>
) {
  const stats = new Map<string, PlayerSummary & { key: string }>();

  const calcPriority = (userId: string | null) => {
    if (userId && memberIds.has(userId)) return 2;
    if (userId) return 1;
    return 0;
  };

  for (const game of games) {
    if (game.ignore_for_stats) continue;

    const result = game.win_v2;
    const storytellerUserId =
      game.is_storyteller && game.user?.user_id ? game.user.user_id : null;
    const storytellerNames = new Set<string>();
    const ownerUsername = game.user?.username?.toLowerCase();

    if (game.storyteller?.trim()) {
      const name = game.storyteller.trim();
      if (!ownerUsername || name.toLowerCase() !== ownerUsername) {
        storytellerNames.add(name);
      }
    }

    if (Array.isArray(game.co_storytellers)) {
      for (const co of game.co_storytellers) {
        const name = co?.trim();
        if (!name) continue;
        if (!ownerUsername || name.toLowerCase() !== ownerUsername) {
          storytellerNames.add(name);
        }
      }
    }

    const perPlayerForGame = new Map<string, PlayerAccumulator>();

    for (const page of game.grimoire ?? []) {
      for (const token of page.tokens ?? []) {
        if (token.role?.type === "FABLED" || token.role?.type === "LORIC") {
          continue;
        }

        const playerIdentity = resolvePlayerIdentity(
          token.player,
          token.player_name,
          memberByUsername,
          memberById
        );
        if (!playerIdentity) continue;

        if (
          storytellerUserId &&
          game.is_storyteller &&
          playerIdentity.user_id === storytellerUserId
        ) {
          continue;
        }

        const alignment = (token.alignment ||
          token.role?.initial_alignment ||
          null) as Alignment;
        if (alignment !== "GOOD" && alignment !== "EVIL") continue;

        let playerEntry = perPlayerForGame.get(playerIdentity.key);
        if (!playerEntry) {
          playerEntry = {
            identity: playerIdentity,
            alignment,
            roles: new Set<string>(),
            roleTokens: new Map<string, string | null>(),
            travelerCount: 0,
            isStoryteller: false,
            roleDetails: new Map<string, RoleDetails>(),
          };
          perPlayerForGame.set(playerIdentity.key, playerEntry);
        }

        playerEntry.alignment = alignment;

        if (token.role?.name) {
          playerEntry.roles.add(token.role.name);
          if (!playerEntry.roleTokens.has(token.role.name)) {
            playerEntry.roleTokens.set(token.role.name, token.role.token_url ?? null);
          }
          if (!playerEntry.roleDetails.has(token.role.name)) {
            playerEntry.roleDetails.set(token.role.name, {
              token_url: token.role.token_url ?? null,
              type: token.role.type ?? null,
              initial_alignment: token.role.initial_alignment ?? null,
            });
          }
          if (token.role.type === "TRAVELER") {
            playerEntry.travelerCount++;
          }
        }
      }
    }

    if (game.is_storyteller && game.user) {
      const member = memberById.get(game.user.user_id);
      const storytellerId = `user:${game.user.user_id}`;
      const existingStory = perPlayerForGame.get(storytellerId);
      if (existingStory) {
        existingStory.isStoryteller = true;
      } else {
        perPlayerForGame.set(storytellerId, {
          identity: {
            key: storytellerId,
            user_id: game.user.user_id,
            username: game.user.username,
            display_name: member?.display_name || game.user.username,
            avatar: member?.avatar ?? game.user.avatar ?? null,
          },
          alignment: null,
          roles: new Set<string>(),
          roleTokens: new Map<string, string | null>(),
          travelerCount: 0,
          isStoryteller: true,
          roleDetails: new Map<string, RoleDetails>(),
        });
      }
    }

    if (storytellerNames.size) {
      for (const name of storytellerNames) {
        const identity = resolveStorytellerIdentity(
          name,
          memberByUsername,
          memberById
        );
        const existingStory = perPlayerForGame.get(identity.key);
        if (existingStory) {
          existingStory.isStoryteller = true;
        } else {
          perPlayerForGame.set(identity.key, {
            identity,
            alignment: null,
            roles: new Set<string>(),
            roleTokens: new Map<string, string | null>(),
            travelerCount: 0,
            isStoryteller: true,
            roleDetails: new Map<string, RoleDetails>(),
          });
        }
      }
    }

    for (const [, entry] of perPlayerForGame) {
      const { identity, alignment, roles, roleTokens, travelerCount, isStoryteller, roleDetails } = entry;

      const existing = stats.get(identity.key) ?? {
        key: identity.key,
        user_id: identity.user_id,
        username: identity.username,
        display_name: identity.display_name ?? identity.username,
        avatar: identity.avatar,
        priority: calcPriority(identity.user_id),
        plays: 0,
        wins: 0,
        losses: 0,
        good_plays: 0,
        evil_plays: 0,
        drunk_plays: 0,
        lunatic_plays: 0,
        mutant_plays: 0,
        damsel_plays: 0,
        traveler_plays: 0,
        storyteller_plays: 0,
        role_tokens: {},
        role_games: {},
        role_details: {},
        roles: {},
      } satisfies PlayerSummary & { key: string };

      existing.priority = Math.max(existing.priority ?? 0, calcPriority(identity.user_id));

      if (!(isStoryteller && roles.size === 0)) {
        existing.plays++;
      }
      if (alignment === "GOOD") existing.good_plays++;
      if (alignment === "EVIL") existing.evil_plays++;

      if (result === WinStatus_V2.GOOD_WINS || result === WinStatus_V2.EVIL_WINS) {
        const goodWon = result === WinStatus_V2.GOOD_WINS;
        const evilWon = result === WinStatus_V2.EVIL_WINS;

        if ((alignment === "GOOD" && goodWon) || (alignment === "EVIL" && evilWon)) {
          existing.wins++;
        } else if ((alignment === "GOOD" && evilWon) || (alignment === "EVIL" && goodWon)) {
          existing.losses++;
        }
      }

      for (const roleName of roles) {
        existing.roles[roleName] = (existing.roles[roleName] ?? 0) + 1;
        if (roleName === "Drunk") existing.drunk_plays++;
        if (roleName === "Lunatic") existing.lunatic_plays++;
        if (roleName === "Mutant") existing.mutant_plays++;
        if (roleName === "Damsel") existing.damsel_plays++;

        if (!existing.role_tokens[roleName]) {
          existing.role_tokens[roleName] = roleTokens.get(roleName) ?? null;
        }
        if (!existing.role_details[roleName]) {
          const details = roleDetails.get(roleName);
          existing.role_details[roleName] = details ?? {
            token_url: null,
            type: null,
            initial_alignment: null,
          };
        }
        const arr = existing.role_games[roleName] ?? [];
        if (!arr.includes(game.id)) {
          arr.push(game.id);
          existing.role_games[roleName] = arr;
        }
      }

      if (travelerCount > 0) {
        existing.traveler_plays++;
      }
      if (isStoryteller) {
        existing.storyteller_plays++;
      }

      stats.set(identity.key, existing);
    }
  }

  return Array.from(stats.values()).sort((a, b) => b.plays - a.plays);
}

// Prefer display names for @username players when we can match a member.
function resolvePlayerIdentity(
  player: CommunityToken["player"] | null,
  playerName: CommunityToken["player_name"] | null,
  memberByUsername: Map<
    string,
    {
      user_id: string;
      username: string;
      display_name: string;
      avatar: string | null;
    }
  >,
  memberById: Map<string, { display_name: string; username: string; avatar: string | null }>
): PlayerIdentity | null {
  if (player?.user_id) {
    const member = memberById.get(player.user_id);
    const username = member?.username || player.username || player.display_name;
    const displayName = member?.display_name || player.display_name || username;
    return {
      key: `user:${player.user_id}`,
      user_id: player.user_id,
      username: username ?? "Unknown",
      display_name: displayName ?? "Unknown",
      avatar: member?.avatar ?? player.avatar ?? null,
    };
  }

  const rawName = playerName || player?.display_name || player?.username;
  if (!rawName) return null;

  const trimmed = rawName.trim();
  const normalized = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  const member = memberByUsername.get(normalized.toLowerCase());
  if (member) {
    return {
      key: `user:${member.user_id}`,
      user_id: member.user_id,
      username: member.display_name || member.username,
      avatar: member.avatar ?? null,
    };
  }

  const fetchedUser = getUserByUsername(rawName);
  if (fetchedUser) {
    return {
      key: `user:${fetchedUser.user_id}`,
      user_id: fetchedUser.user_id,
      username: fetchedUser.username,
      display_name: fetchedUser.display_name || fetchedUser.username,
      avatar: fetchedUser.avatar ?? null,
    };
  }

  const name = normalized;
  if (!name) return null;

  return {
    key: `name:${name.toLowerCase()}`,
    user_id: null,
    username: name,
    display_name: name,
    avatar: player?.avatar ?? null,
  };
}

</script>

<style>
  .redacted-name {
    display: inline-block;
    @apply text-stone-800 bg-stone-800;
    @apply h-[.75rem] overflow-hidden select-none;
    position: relative;
    inset-block-end: -1px;
    inset-inline-start: 1px;
    overflow: hidden;

    
  }  

  .v-popper__popper .redacted-name {
      @apply text-stone-100 bg-stone-100;
    }
</style>

<style scoped>
  .community-grid-8 {
    grid-template-columns: repeat(3, minmax(0, 1fr));

    @media (min-width: 768px) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    @media (min-width: 1024px) {
      grid-template-columns: repeat(8, minmax(0, 1fr));
    }
  }
</style>

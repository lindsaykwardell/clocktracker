<template>
  <template v-if="games.status === Status.SUCCESS && ready">
    <template v-if="games.data.length">
      <section class="w-full flex flex-col md:flex-row gap-8 pb-20 md:pb-0">
        <div class="w-full flex flex-col gap-4">
          <div class="flex flex-col lg:flex-row gap-3 px-4">
            <div class="flex flex-col md:flex-row gap-3 items-center">
              <template v-if="!selectMultipleGames.enabled">
                <Input
                  mode="select"
                  v-model="sortBy"
                  class="w-full md:w-auto rounded text-lg bg-stone-200 dark:bg-stone-600 border-0"
                >
                  <option value="date">Sort by Date</option>
                  <option value="character">Sort by Character</option>
                  <option value="alignment">Sort by Alignment</option>
                  <option value="script">Sort by Script</option>
                  <option value="location">Sort by Location</option>
                  <option value="community_name">Sort by Community</option>
                  <option value="players">Sort by Players</option>
                  <option value="favorite">Sort by Favorite</option>
                </Input>
                <Input
                  mode="select"
                  v-model="orderBy"
                  class="w-full md:w-auto rounded p-1 text-lg bg-stone-200 dark:bg-stone-600 border-0"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </Input>
                <div class="relative w-full md:w-auto">
                  <Menu>
                    <MenuButton class="relative w-full md:w-auto">
                      <span
                        v-if="activeFilters.length"
                        class="absolute -top-2 -right-2 text-stone-200 bg-red-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
                        aria-label="Unread notifications"
                      >
                        {{ activeFilters.length }}
                      </span>
                      <Button 
                        class="font-normal w-full whitespace-nowrap"
                        hasIcon
                      >
                        <div
                          class="w-full flex gap-2 items-center md:justify-center"
                        >
                          <IconUI id="filter" />
                          Filter Games
                        </div>
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
                        class="absolute top-[100%] left-0 md:right-0 md:left-auto lg:right-auto lg:left-0 z-20 bg-stone-950 p-2 rounded shadow-md whitespace-nowrap flex flex-col gap-2 items-start w-full md:w-[350px]"
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
                        <MenuItem>
                          <label class="w-full">
                            <select
                              v-model="selectedRole"
                              @click.stop
                              class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                              aria-label="Role"
                            >
                              <option :value="null">Filter by character</option>
                              <option
                                v-for="role in myRoles"
                                :key="role"
                                :value="role"
                              >
                                {{ role }}
                              </option>
                            </select>
                          </label>
                        </MenuItem>
                        <MenuItem>
                          <label class="w-full">
                            <select
                              v-model="selectedAlignment"
                              @click.stop
                              class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                              aria-label="Alignment"
                            >
                              <option :value="null">Filter by alignment</option>
                              <option value="GOOD">Good</option>
                              <option value="EVIL">Evil</option>
                            </select>
                          </label>
                        </MenuItem>
                        <MenuItem>
                          <label class="w-full">
                            <select
                              v-model="selectedScript"
                              @click.stop
                              class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                              aria-label="Script"
                            >
                              <option :value="null">Filter by script</option>
                              <option
                                v-for="script in myScripts"
                                :key="script"
                                :value="script"
                              >
                                {{ script }}
                              </option>
                            </select>
                          </label>
                        </MenuItem>
                        <MenuItem v-if="myLocations.length">
                          <label class="w-full">
                            <select
                              v-model="selectedLocation"
                              @click.stop
                              class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                              aria-label="Community"
                            >
                              <option :value="null">Filter by location</option>
                              <option
                                v-for="location in myLocations"
                                :key="location"
                              >
                                {{ location }}
                              </option>
                            </select>
                          </label>
                        </MenuItem>
                        <MenuItem v-if="myCommunities.length">
                          <label class="flex gap-2 items-center w-full">
                            <select
                              v-model="selectedCommunity"
                              @click.stop
                              class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                              aria-label="Community"
                            >
                              <option :value="null">Filter by community</option>
                              <option
                                v-for="community in myCommunities"
                                :key="community"
                              >
                                {{ community }}
                              </option>
                            </select>
                          </label>
                        </MenuItem>
                        <MenuItem>
                          <label class="w-full">
                            <select
                              v-model="selectedWinState"
                              @click.stop
                              class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                              aria-label="Alignment"
                            >
                              <option :value="null">Filter by win/loss</option>
                              <option :value="WinStatus_V2.GOOD_WINS">
                                Good wins
                              </option>
                              <option :value="WinStatus_V2.EVIL_WINS">
                                Evil wins
                              </option>
                              <option :value="WinStatus_V2.NOT_RECORDED">
                                Not recorded
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
                                v-for="tag in myTags.filter(
                                  (tag) => !selectedTags.includes(tag)
                                )"
                                :key="tag"
                              >
                                {{ tag }}
                              </option>
                            </select>
                          </label>
                        </MenuItem>
                        <MenuItem>
                          <label class="w-full">
                            <select
                              v-model="selectedPlayer"
                              @click.stop
                              class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                              aria-label="Tags"
                            >
                              <option :value="null">Filter by player</option>
                              <option
                                v-for="player in mySelectedPlayers.filter(
                                  (player) => !selectedPlayers.includes(player)
                                )"
                                :key="player"
                              >
                                {{ player }}
                              </option>
                            </select>
                          </label>
                        </MenuItem>
                      </MenuItems>
                    </transition>
                  </Menu>
                </div>
              </template>
              <template v-else>
                <div class="relative w-full md:w-auto">
                  {{ selectMultipleGames.selectedGames.length }} game{{
                    selectMultipleGames.selectedGames.length !== 1 ? "s" : ""
                  }}
                  selected
                </div>
                <div class="relative w-full md:w-auto">
                  <Button
                    class="font-normal w-full"
                    :disabled="selectMultipleGames.selectedGames.length <= 0"
                    @click="deleteMultipleGames"
                  >
                    <span class="w-full text-left">
                      Delete game{{
                        selectMultipleGames.selectedGames.length !== 1
                          ? "s"
                          : ""
                      }}
                    </span>
                  </Button>
                </div>
                <div class="relative w-full md:w-auto">
                  <Button
                    component="nuxt-link"
                    to="/edit-games"
                    class="font-normal w-full"
                    :disabled="selectMultipleGames.selectedGames.length <= 0"
                  >
                    <span class="w-full text-left">
                      Edit game{{
                        selectMultipleGames.selectedGames.length !== 1
                          ? "s"
                          : ""
                      }}
                    </span>
                  </Button>
                </div>
                <div v-if="canPostToBGG" class="relative w-full md:w-auto">
                  <Button
                    class="font-normal w-full flex items-center h-[2.5rem]"
                    custom="bg-[#3f3a60] hover:bg-[#2e2950]"
                    :disabled="selectMultipleGames.selectedGames.length <= 0"
                    @click="
                      selectMultipleGames.selectedGamesHaveBGG
                        ? deleteMultipleFromBGG(
                            selectMultipleGames.selectedGames
                          )
                        : postMultipleToBGG(selectMultipleGames.selectedGames)
                    "
                  >
                    <div class="w-6">
                      <img
                        src="/img/bgg.png"
                        class="w-6 h-6 m-auto"
                        :class="{ 'animate-spin': bggInFlight }"
                      />
                    </div>
                    <span
                      class="text-left w-full"
                      v-if="selectMultipleGames.selectedGamesHaveBGG"
                      >Delete from BGG</span
                    >
                    <span class="text-left w-full" v-else>Post to BGG</span>
                  </Button>
                </div>
              </template>
              <div v-if="myPage" class="w-full md:w-auto">
                <Button
                  @click="selectMultipleGames.toggleMode"
                  class="font-normal w-full"
                  :tertiary="selectMultipleGames.enabled"
                >
                  <div class="w-full text-left whitespace-nowrap">
                    <template v-if="selectMultipleGames.enabled">
                      <span>Cancel</span>
                    </template>
                    <template v-else>Select Games</template>
                  </div>
                </Button>
              </div>
            </div>
            <div class="flex-grow"></div>
            <div class="flex gap-2 items-center justify-end">
              <slot>
                <div class="text-xl dark:text-stone-200 whitespace-nowrap">
                  {{ sortedGames.length }} game{{
                    sortedGames.length !== 1 ? "s" : ""
                  }}
                </div>
              </slot>
              <Button
                class="w-[100px]"
                @click="gameView = 'grid'"
                :disabled="gameView === 'grid'"
                hasIcon
              >
                <IconUI id="grid" />
                Grid
              </Button>
              <Button
                class="w-[100px]"
                @click="gameView = 'table'"
                :disabled="gameView === 'table'"
                hasIcon
              >
                <IconUI id="table" />
                Table
              </Button>
            </div>
          </div>
          <div class="flex flex-col md:flex-row gap-3 px-4">
            <div class="flex flex-wrap gap-2">
              <Button
                v-if="startDateRange !== null"
                font-size="md"
                @click.prevent="startDateRange = null"
                :title="`Remove after ${formatDate(new Date(startDateRange))} date filter`"
                hasIcon
                tag
              >
                After Date: {{ formatDate(new Date(startDateRange)) }}<IconUI id="x" />
              </Button>
              <Button
                v-if="endDateRange !== null"
                font-size="md"
                @click.prevent="endDateRange = null"
                :title="`Remove before ${formatDate(new Date(endDateRange))} date filter`"
                hasIcon
                tag
              >
                Before Date: {{ formatDate(new Date(endDateRange)) }}<IconUI id="x" />
              </Button>
              <Button
                v-if="minPlayers !== null"
                font-size="md"
                @click.prevent="minPlayers = null"
                :title="`Remove min ${minPlayers} playercount filter`"
                hasIcon
                tag
              >
                Min Players: {{ minPlayers }}<IconUI id="x" />
              </Button>
              <Button
                v-if="maxPlayers !== null"
                font-size="md"
                @click.prevent="maxPlayers = null"
                :title="`Remove max ${maxPlayers} playercount filter `"
                hasIcon
                tag
              >
                Max Players: {{ maxPlayers }}<IconUI id="x" />
              </Button>
              <Button
                v-if="selectedRole"
                font-size="md"
                @click.prevent="selectedRole = null"
                :title="`Remove ${selectedRole} role filter`"
                hasIcon
                tag
              >
                Character: {{ selectedRole }}<IconUI id="x" />
              </Button>
              <Button
                v-if="selectedAlignment"
                font-size="md"
                @click.prevent="selectedAlignment = null"
                :title="`Remove alignment`"
                hasIcon
                tag
              >
                Alignment:
                <template v-if="selectedAlignment === 'GOOD'">Good</template>
                <template v-else-if="selectedAlignment === 'EVIL'"
                  >Evil</template
                >
                <IconUI id="x" />
              </Button>
              <Button
                v-if="selectedScript"
                font-size="md"
                @click.prevent="selectedScript = null"
                :title="`Remove ${selectedScript} script filter`"
                hasIcon
                tag
              >
                Script: {{ selectedScript }}<IconUI id="x" />
              </Button>
              <Button
                v-if="selectedLocation"
                font-size="md"
                @click.prevent="selectedLocation = null"
                :title="`Remove ${selectedLocation} location filter`"
                hasIcon
                tag
              >
                Location: {{ selectedLocation }}<IconUI id="x" />
              </Button>
              <Button
                v-if="selectedCommunity"
                font-size="md"
                @click.prevent="selectedCommunity = null"
                :title="`Remove ${selectedCommunity} community filter`"
                hasIcon
                tag
              >
                Community: {{ selectedCommunity }}<IconUI id="x" />
              </Button>
              <Button
                v-if="selectedWinState"
                font-size="md"
                @click.prevent="selectedWinState = null"
                :title="`Remove win/loss filter`"
                hasIcon
                tag
              >
                Win/Loss:
                <template v-if="selectedWinState === WinStatus_V2.GOOD_WINS"
                  >Good wins</template
                >
                <template
                  v-else-if="selectedWinState === WinStatus_V2.EVIL_WINS"
                  >Evil wins</template
                >
                <template
                  v-else-if="selectedWinState === WinStatus_V2.NOT_RECORDED"
                  >Not recorded</template
                >
                <IconUI id="x" />
              </Button>
              <Button
                v-for="(player, index) in selectedPlayers"
                font-size="md"
                @click.prevent="selectedPlayers.splice(index, 1)"
                :title="`Remove ${player} player filter`"
                hasIcon
                tag
              >
                Player: {{ player }}<IconUI id="x" />
              </Button>
              <Button
                v-for="(tag, index) in selectedTags"
                font-size="md"
                @click.prevent="selectedTags.splice(index, 1)"
                :title="`Remove ${tag} tag filter`"
                hasIcon
                tag
              >
                Tag: {{ tag }}<IconUI id="x" />
              </Button>
            </div>
          </div>
          <div class="w-screen md:w-auto overflow-hidden">
            <GameOverviewGrid
              v-if="gameView === 'grid'"
              :games="sortedGames"
              :showCommunityCard="showCommunityCard"
            />
            <GameOverviewList
              v-if="gameView === 'table'"
              :games="sortedGames"
              :showCommunityCard="showCommunityCard"
            />
            <p
              v-if="!sortedGames.length"
              class="text-center text-2xl my-4 font-sorts"
            >
              No games match!
            </p>
          </div>
        </div>
      </section>
    </template>
    <div v-else class="flex flex-col items-center gap-6">
      <slot name="no-content">
        <div class="flex flex-col items-center gap-6">
          <p class="text-center text-2xl font-sorts">No games yet!</p>
          <template v-if="player && user && user.id === player.user_id">
            <Button
              component="nuxt-link"
              to="/add-game"
              class="w-[300px] py-2"
              font-size="xl"
              primary
            >
              Add Your First Game
            </Button>
            <p>or</p>
            <button
              type="button"
              @click="initImportGames"
              class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded text-center text-xl m-auto block w-[300px]"
            >
              Import Games
            </button>
          </template>
        </div>
      </slot>
    </div>
    <ImportGamesDialog v-model:visible="importGamesDialogVisible" />
  </template>
  <template v-else>
    <Loading />
  </template>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import type { WinStatus_V2 } from "~/composables/useGames";
import { useLocalStorage } from "@vueuse/core";

const user = useSupabaseUser();
const users = useUsers();
const roles = useRoles();
const allGames = useGames();
const importGamesDialogVisible = ref(false);
const selectMultipleGames = useSelectMultipleGames();
const { canPostToBGG, bggInFlight, postMultipleToBGG, deleteMultipleFromBGG } =
  useBGG();
const me = useMe();

const myPage = computed(() => {
  if (me.value?.status === Status.SUCCESS) {
    return me.value.data.username === props.player?.username;
  } else {
    return false;
  }
});

const myTags = computed(() => {
  if (me.value?.status === Status.SUCCESS) {
    return allGames.getTagsByPlayer(me.value.data.username);
  } else {
    return [];
  }
});

const mySelectedPlayers = computed(() => {
  if (props.games.status === Status.SUCCESS) {
    return [
      ...new Set(
        naturalOrder([
          ...props.games.data.flatMap((game) =>
            game.grimoire.flatMap((g) =>
              g.tokens.map((t) => t.player?.display_name || t.player_name)
            )
          ),
          ...props.games.data.map(
            (game) =>
              (game.is_storyteller ? game.user.username : game.storyteller) ??
              ""
          ),
          ...props.games.data.flatMap((game) => game.co_storytellers),
        ])
          .sort()
          .filter((n) => n !== "")
      ),
    ];
  } else {
    return [];
  }
});

const myRoles = computed(() => {
  if (props.games.status !== Status.SUCCESS) {
    return [];
  }
  return naturalOrder([
    ...new Set(
      props.games.data
        .flatMap((game) =>
          game.is_storyteller
            ? ["Storyteller"]
            : game.player_characters.map((c) => c.name)
        )
        .filter((role) => role) as string[]
    ),
  ]).sort();
});

const myCommunities = computed(() => {
  if (!props.player) {
    return [];
  } else {
    return allGames.getCommunityNamesByPlayer(props.player.username);
  }
});

const myScripts = computed(() => {
  if (props.games.status !== Status.SUCCESS) {
    return [];
  }
  return naturalOrder([
    ...new Set(
      props.games.data.filter((game) => game.script).map((game) => game.script)
    ),
  ]).sort();
});

const myLocations = computed(() => {
  if (props.games.status !== Status.SUCCESS) {
    return [];
  }
  return naturalOrder([
    ...new Set(
      props.games.data
        .filter((game) => game.location)
        .map((game) => game.location)
    ),
  ]).sort();
  // if (props.communitySlug) {
  //   return allGames.getLocationsByCommunity(props.communitySlug);
  // }
  // return allGames.getLocationsByPlayer(props.player?.username || "");
});

const ready = ref(false);
const gameView = useLocalStorage<"grid" | "table">("gameView", "grid");
const sortBy = ref<
  | "character"
  | "date"
  | "script"
  | "location"
  | "community_name"
  | "players"
  | "alignment"
  | "favorite"
>("date");
const orderBy = useLocalStorage<"asc" | "desc">("games__orderBy", "desc");
const selectedTag = ref<string | null>(null);
const selectedTags = useLocalStorage<string[]>("games__selectedTags", []);
const selectedPlayer = ref<string | null>(null);
const selectedPlayers = useLocalStorage<string[]>("games__selectedPlayers", []);
const selectedRole = useLocalStorage<string | null>(
  "games__selectedRole",
  null
);
const selectedCommunity = useLocalStorage<string | null>(
  "games__selectedCommunity",
  null
);
const selectedAlignment = useLocalStorage<"GOOD" | "EVIL" | null>(
  "games__selectedAlignment",
  null
);
const selectedWinState = useLocalStorage<WinStatus_V2 | null>(
  "games__selectedWinState",
  null
);
const minPlayers = useLocalStorage<string | null>("games__minPlayers", null);
const maxPlayers = useLocalStorage<string | null>("games__maxPlayers", null);
const startDateRange = useLocalStorage<string | null>(
  "games__startDateRange",
  null
);
const endDateRange = useLocalStorage<string | null>(
  "games__endDateRange",
  null
);
const selectedScript = useLocalStorage<string | null>(
  "games__selectedScript",
  null
);
const selectedLocation = useLocalStorage<string | null>(
  "games__selectedLocation",
  null
);

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

watchEffect(() => {
  if (selectedTag.value) {
    selectedTags.value.push(selectedTag.value);
    selectedTag.value = null;
  }
});

watchEffect(() => {
  if (selectedPlayer.value) {
    selectedPlayers.value.push(selectedPlayer.value);
    selectedPlayer.value = null;
  }
});

const props = defineProps<{
  player: {
    username: string;
    user_id: string;
    display_name: string;
    avatar: string | null;
    pronouns: string | null;
    bio: string;
    location: string | null;
  } | null;
  games: FetchStatus<GameRecord[]>;
  communitySlug?: string;
  showCommunityCard?: boolean;
}>();

const activeFilters = computed(() => {
  return [
    ...selectedTags.value.map((tag) => ({ type: "tag", value: tag })),
    ...selectedPlayers.value.map((player) => ({
      type: "player",
      value: player,
    })),
    ...(selectedRole.value
      ? [{ type: "role", value: selectedRole.value }]
      : []),
    ...(selectedCommunity.value
      ? [{ type: "community", value: selectedCommunity.value }]
      : []),
    ...(selectedAlignment.value
      ? [{ type: "alignment", value: selectedAlignment.value }]
      : []),
    ...(selectedWinState.value
      ? [{ type: "win_state", value: selectedWinState.value }]
      : []),
    ...(minPlayers.value
      ? [{ type: "min_players", value: minPlayers.value }]
      : []),
    ...(maxPlayers.value
      ? [{ type: "max_players", value: maxPlayers.value }]
      : []),
    ...(startDateRange.value
      ? [{ type: "start_date", value: startDateRange.value }]
      : []),
    ...(endDateRange.value
      ? [{ type: "end_date", value: endDateRange.value }]
      : []),
    ...(selectedScript.value
      ? [{ type: "script", value: selectedScript.value }]
      : []),
    ...(selectedLocation.value
      ? [{ type: "location", value: selectedLocation.value }]
      : []),
  ];
});

function isFavorite(game: GameRecord) {
  const user = users.getUserById(game.user_id);

  if (user.status !== Status.SUCCESS) return false;

  return user.data.favorites.some((f) => f.game_id === game.id);
}

const sortedGames = computed(() => {
  if (props.games.status !== Status.SUCCESS) {
    return [];
  }
  return naturalOrder(
    props.games.data.map((g) => ({
      ...g,
      total_players: (g.player_count ?? 0) + (g.traveler_count ?? 0) || -1,
      last_character: g.is_storyteller
        ? "Storyteller"
        : g.player_characters[g.player_characters.length - 1]?.name,
      last_alignment:
        g.player_characters[g.player_characters.length - 1]?.alignment,
      // Hack to properly sort by date. I'm sorry.
      favorite: !isFavorite(g),
    }))
  )
    .orderBy(orderBy.value)
    .sort(
      (() => {
        switch (sortBy.value) {
          case "date":
            return ["date", "created_at"];
          case "character":
            return ["last_character", "date", "created_at"];
          case "alignment":
            return ["last_alignment", "date", "created_at"];
          case "script":
            return ["script", "date", "created_at"];
          case "location":
            return ["location_type", "location", "date", "created_at"];
          case "community_name":
            return ["community_name", "date", "created_at"];
          case "players":
            return ["total_players", "date", "created_at"];
          case "favorite":
            return ["favorite", "date", "created_at"];
          default:
            return ["created_at"];
        }
      })()
    )
    .filter(
      (game) =>
        (!selectedTags.value.length ||
          selectedTags.value.every((tag) => game.tags.includes(tag))) &&
        (!selectedPlayers.value.length ||
          selectedPlayers.value.every(
            (tag) =>
              game.grimoire
                .flatMap((g) =>
                  g.tokens.map((t) =>
                    t.player?.display_name
                      ? t.player.display_name
                      : t.player_name
                  )
                )
                .includes(tag) ||
              (me.value.status === "SUCCESS" &&
                me.value?.data.username === tag &&
                game.is_storyteller) ||
              (game.storyteller === tag && !game.is_storyteller) ||
              game.co_storytellers.includes(tag)
          )) &&
        (!selectedRole.value ||
          game.player_characters.some((c) => c.name === selectedRole.value) ||
          (game.is_storyteller && selectedRole.value === "Storyteller")) &&
        (!selectedCommunity.value ||
          game.community_name.trim() === selectedCommunity.value.trim()) &&
        (!selectedAlignment.value ||
          game.player_characters.some(
            (c) => c.alignment === selectedAlignment.value
          )) &&
        (!selectedWinState.value || game.win_v2 === selectedWinState.value) &&
        (minPlayers.value === null ||
          (game.player_count ?? 0) >= +minPlayers.value) &&
        (maxPlayers.value === null ||
          (game.player_count ?? 0) <= +maxPlayers.value) &&
        (!startDateRange.value ||
          new Date(game.date) >= new Date(startDateRange.value)) &&
        (!endDateRange.value ||
          new Date(game.date) <= new Date(endDateRange.value)) &&
        (!selectedScript.value || game.script === selectedScript.value) &&
        (!selectedLocation.value ||
          game.location.trim() === selectedLocation.value.trim())
    );
});

async function deleteMultipleGames() {
  if (
    confirm(
      `Are you sure you want to delete ${
        selectMultipleGames.selectedGames.length
      } game${selectMultipleGames.selectedGames.length === 1 ? "" : "s"}?`
    )
  ) {
    await allGames.deleteMultipleGames(selectMultipleGames.selectedGames);

    selectMultipleGames.toggleMode();
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language, {
    timeZone: "UTC",
  }).format(new Date(date));
}

onMounted(() => {
  selectMultipleGames.selection = { type: "OFF" };
  roles.fetchRoles();

  ready.value = true;
});

function initImportGames() {
  importGamesDialogVisible.value = true;
}
</script>

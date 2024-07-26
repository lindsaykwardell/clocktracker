<template>
  <template v-if="player && games.status === Status.SUCCESS && ready">
    <template v-if="games.data.length">
      <section class="w-full flex flex-col md:flex-row gap-8 pb-20 md:pb-0">
        <div class="w-full flex flex-col gap-4">
          <div class="flex flex-col lg:flex-row gap-3 px-4">
            <div class="flex flex-col md:flex-row gap-3">
              <label class="flex gap-2 items-center">
                <select
                  v-model="sortBy"
                  class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                >
                  <option value="date">Sort by Date</option>
                  <option value="character">Sort by Character</option>
                  <option value="script">Sort by Script</option>
                  <option value="location">Sort by Location</option>
                  <option value="community_name">Sort by Community</option>
                  <option value="players">Sort by Players</option>
                </select>
              </label>
              <label class="flex gap-2 items-center">
                <select
                  v-model="orderBy"
                  class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </label>
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
                    <Button class="py-0 md:mt-1 font-normal w-full">
                      <div
                        class="w-full flex gap-2 items-center md:justify-center"
                      >
                        Filter Games
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M10 18v-2h4v2zm-4-5v-2h12v2zM3 8V6h18v2z"
                          />
                        </svg>
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
                      class="absolute top-[100%] z-20 bg-stone-950 p-2 rounded shadow-md whitespace-nowrap flex flex-col gap-2 items-start w-full md:w-[300px]"
                    >
                      <MenuItem>
                        <label class="w-full">
                          <select
                            v-model="selectedRole"
                            @click.stop
                            class="w-full rounded p-1 text-lg bg-stone-200 dark:bg-stone-600"
                            aria-label="Role"
                          >
                            <option :value="null">Filter by role</option>
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
            </div>
            <div class="flex-grow"></div>
            <div class="flex gap-2 items-center justify-end">
              <slot />
              <Button
                class="w-[100px]"
                :class="{
                  'bg-stone-200 dark:bg-stone-600': gameView !== 'grid',
                  'bg-stone-300 dark:bg-stone-700 text-stone-400 dark:text-stone-500 hover:text-inherit':
                    gameView !== 'grid',
                }"
                @click="gameView = 'grid'"
                :disabled="gameView === 'grid'"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                >
                  <path
                    fill="currentColor"
                    d="M12 4H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 8H6V6h6zm14-8h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 8h-6V6h6zm-14 6H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2zm0 8H6v-6h6zm14-8h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2zm0 8h-6v-6h6z"
                  />
                </svg>
                Grid
              </Button>
              <Button
                class="w-[100px]"
                :class="{
                  'bg-stone-200 dark:bg-stone-600': gameView !== 'table',
                  'bg-stone-300 dark:bg-stone-700 text-stone-400 dark:text-stone-500 hover:text-inherit':
                    gameView !== 'table',
                }"
                @click="gameView = 'table'"
                :disabled="gameView === 'table'"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                >
                  <path
                    fill="currentColor"
                    d="M12 29H5a2.002 2.002 0 0 1-2-2v-7a2.002 2.002 0 0 1 2-2h7a2.002 2.002 0 0 1 2 2v7a2.002 2.002 0 0 1-2 2Zm-7-9v7h7v-7Z"
                  />
                  <path
                    fill="currentColor"
                    d="M27 3H5a2 2 0 0 0-2 2v10h2v-4h10v4h2v-4h10v7H17v2h10v7H17v2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 6H5V5h22Z"
                  />
                </svg>
                Table
              </Button>
            </div>
          </div>
          <div class="flex flex-col md:flex-row gap-3 px-4">
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="(player, index) in selectedPlayers"
                font-size="md"
                @click.prevent="selectedPlayers.splice(index, 1)"
              >
                Player: {{ player }}
              </Button>
              <Button
                v-for="(tag, index) in selectedTags"
                font-size="md"
                @click.prevent="selectedTags.splice(index, 1)"
              >
                Tag: {{ tag }}
              </Button>
            </div>
          </div>
          <div class="w-screen md:w-auto overflow-hidden">
            <GameOverviewGrid
              v-if="gameView === 'grid'"
              :games="sortedGames"
              :readonly="!myPage"
            />
            <GameOverviewList
              v-if="gameView === 'table'"
              :games="sortedGames"
              :username="player.username"
              :readonly="!myPage"
            />
            <p
              v-if="!sortedGames.length"
              class="text-center text-2xl my-4 font-dumbledor"
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
          <p class="text-center text-2xl font-dumbledor">No games yet!</p>
          <template v-if="user && user.id === player.user_id">
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

const user = useSupabaseUser();
const users = useUsers();
const roles = useRoles();
const allGames = useGames();
const importGamesDialogVisible = ref(false);

const me = computed(() => {
  if (user.value) {
    return users.getUserById(user.value.id);
  }
  return null;
});

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
        naturalOrder(
          props.games.data.flatMap((game) =>
            game.grimoire.flatMap((g) =>
              g.tokens.map((t) => t.player?.display_name || t.player_name)
            )
          )
        )
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

const ready = ref(false);
const gameView = ref<"grid" | "table">("grid");
const sortBy = ref<
  "character" | "date" | "script" | "location" | "community_name" | "players"
>("date");
const orderBy = ref<"asc" | "desc">("desc");
const selectedTag = ref<string | null>(null);
const selectedTags = ref<string[]>([]);
const selectedPlayer = ref<string | null>(null);
const selectedPlayers = ref<string[]>([]);
const selectedRole = ref<string | null>(null);
const selectedCommunity = ref<string | null>(null);

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
  ];
});

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
          case "script":
            return ["script", "date", "created_at"];
          case "location":
            return ["location_type", "location", "date", "created_at"];
          case "community_name":
            return ["community_name", "date", "created_at"];
          case "players":
            return ["total_players", "date", "created_at"];
          default:
            return ["created_at"];
        }
      })()
    )
    .filter(
      (game) =>
        (!selectedTags.value.length ||
          selectedTags.value.every((tag) => game.tags.includes(tag))) && // filter by tags
        (!selectedPlayers.value.length ||
          selectedPlayers.value.every((tag) =>
            game.grimoire
              .flatMap((g) =>
                g.tokens.map((t) =>
                  t.player?.display_name ? t.player.display_name : t.player_name
                )
              )
              .includes(tag)
          )) && // filter by tags
        (!selectedRole.value ||
          game.player_characters.some((c) => c.name === selectedRole.value) ||
          (game.is_storyteller && selectedRole.value === "Storyteller")) && // filter by role
        (!selectedCommunity.value ||
          game.community_name.trim() === selectedCommunity.value.trim()) // filter by community
    );
});

onMounted(() => {
  roles.fetchRoles();

  const lastSortBy = localStorage.getItem("lastSortBy");
  const lastOrderBy = localStorage.getItem("lastOrderBy");
  const lastGameView = localStorage.getItem("lastGameView");
  const lastSelectedTags = localStorage.getItem("lastSelectedTags");
  const lastSelectedPlayers = localStorage.getItem("lastSelectedPlayers");
  const lastSelectedRole = localStorage.getItem("lastSelectedRole");
  if (lastSortBy) {
    sortBy.value = lastSortBy as any;
  }
  if (lastOrderBy) {
    orderBy.value = lastOrderBy as any;
  }
  if (lastGameView) {
    gameView.value = lastGameView as any;
  }
  if (lastSelectedTags) {
    selectedTags.value = JSON.parse(lastSelectedTags);
  }
  if (lastSelectedPlayers) {
    selectedPlayers.value = JSON.parse(lastSelectedPlayers);
  }
  if (lastSelectedRole) {
    selectedRole.value = lastSelectedRole;
  }
  ready.value = true;
});

watch(
  () => sortBy.value,
  (value) => {
    localStorage.setItem("lastSortBy", value);
  }
);
watch(
  () => orderBy.value,
  (value) => {
    localStorage.setItem("lastOrderBy", value);
  }
);
watch(
  () => gameView.value,
  (value) => {
    localStorage.setItem("lastGameView", value);
  }
);
watch(
  () => selectedTags.value,
  (value) => {
    localStorage.setItem("lastSelectedTags", JSON.stringify(value));
  },
  { deep: true }
);
watch(
  () => selectedPlayers.value,
  (value) => {
    localStorage.setItem("lastSelectedPlayers", JSON.stringify(value));
  },
  { deep: true }
);
watch(
  () => selectedRole.value,
  (value) => {
    localStorage.setItem("lastSelectedRole", value || "");
  }
);

function initImportGames() {
  importGamesDialogVisible.value = true;
}
</script>

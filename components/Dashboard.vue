<template>
  <template v-if="player && ready">
    <template v-if="games.length">
      <section class="w-full flex flex-col md:flex-row gap-8 pb-20 md:pb-0">
        <div class="w-full flex flex-col gap-4">
          <div class="flex flex-col md:flex-row gap-3 px-4">
            <label class="flex gap-2 items-center">
              <span class="block whitespace-nowrap w-20 md:w-auto"
                >Sort By</span
              >
              <select
                v-model="sortBy"
                class="w-full rounded p-1 text-lg bg-stone-600"
              >
                <option value="date">Date</option>
                <option value="character">Character</option>
                <option value="script">Script</option>
                <option value="location">Location</option>
                <option value="community">Community</option>
                <option value="players">Players</option>
              </select>
            </label>
            <label class="flex gap-2 items-center">
              <span class="block whitespace-nowrap w-20 md:w-auto">Order</span>
              <select
                v-model="orderBy"
                class="w-full rounded p-1 text-lg bg-stone-600"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
            <div class="flex-grow"></div>
            <div class="flex gap-2 items-center">
              <button
                class="rounded w-[100px] py-1 justify-center text-lg flex gap-2 bg-stone-600 hover:bg-stone-700 transition duration-150"
                :class="{
                  'bg-stone-600': gameView !== 'grid',
                  'bg-stone-700': gameView === 'grid',
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
              </button>
              <button
                class="rounded w-[100px] py-1 justify-center text-lg flex gap-2 bg-stone-600 hover:bg-stone-700 transition duration-150"
                :class="{
                  'bg-stone-600': gameView !== 'table',
                  'bg-stone-700': gameView === 'table',
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
              </button>
            </div>
          </div>
          <div class="w-screen md:w-auto overflow-hidden">
            <GameOverviewGrid
              v-if="gameView === 'grid'"
              :games="sortedGames"
              :username="player.username"
            />
            <GameOverviewList
              v-if="gameView === 'table'"
              :games="sortedGames"
              :username="player.username"
            />
          </div>
        </div>
      </section>
    </template>
    <template v-else>
      <p class="text-center text-2xl my-4 font-dumbledor">No games yet!</p>
      <nuxt-link
        v-if="user && user.id === player.user_id"
        to="/add-game"
        class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded text-center text-xl m-auto block w-[300px] my-8"
      >
        Add Your First Game
      </nuxt-link>
    </template>
  </template>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import naturalOrder from "natural-order";

const ready = ref(false);
const gameView = ref<"grid" | "table">("grid");
const sortBy = ref<
  "character" | "date" | "script" | "location" | "community" | "players"
>("date");
const orderBy = ref<"asc" | "desc">("desc");

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
  games: (Game & {
    player_characters: (Character & { role?: { token_url: string } })[];
  })[];
}>();

const user = useSupabaseUser();

const sortedGames = computed(() =>
  naturalOrder(
    props.games.map((game) => ({
      ...game,
      last_character: game.player_characters[
        game.player_characters.length - 1
      ] || {
        id: "",
        name: "",
        alignment: "",
        related: null,
        game_id: game.id,
      },
    }))
  )
    .orderBy(orderBy.value)
    .sort(
      (() => {
        switch (sortBy.value) {
          case "date":
            return ["date", "created_at"];
          case "character":
            return ["last_character.name"];
          case "script":
            return ["script"];
          case "location":
            return ["location_type", "location"];
          case "community":
            return ["community"];
          case "players":
            return ["player_count"];
          default:
            return [];
        }
      })()
    )
);

onMounted(() => {
  const lastSortBy = localStorage.getItem("lastSortBy");
  const lastOrderBy = localStorage.getItem("lastOrderBy");
  const lastGameView = localStorage.getItem("lastGameView");
  if (lastSortBy) {
    sortBy.value = lastSortBy as any;
  }
  if (lastOrderBy) {
    orderBy.value = lastOrderBy as any;
  }
  if (lastGameView) {
    gameView.value = lastGameView as any;
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
</script>

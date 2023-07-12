<template>
  <template v-if="player">
    <template v-if="games.length">
      <section class="flex flex-col md:flex-row gap-8 pb-20 md:pb-0">
        <div class="w-full flex flex-col gap-8">
          <div class="flex flex-col items-center p-2">
            <Avatar :value="player.avatar || ''" class="border-2 shadow-xl" />
            <h3 class="font-dumbledor text-2xl lg:text-3xl">
              {{ player.display_name }}
            </h3>
            <div class="md:text-lg text-stone-400">
              {{ player.username }}
              <template v-if="player.pronouns">
                | {{ player.pronouns }}</template
              >
            </div>
            <div class="md:text-lg text-stone-400 flex gap-2 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 32 32"
              >
                <path
                  fill="currentColor"
                  d="M16 2a14 14 0 1 0 14 14A14.016 14.016 0 0 0 16 2ZM4.02 16.394l1.338.446L7 19.303v1.283a1 1 0 0 0 .293.707L10 24v2.377a11.994 11.994 0 0 1-5.98-9.983ZM16 28a11.968 11.968 0 0 1-2.572-.285L14 26l1.805-4.512a1 1 0 0 0-.097-.926l-1.411-2.117a1 1 0 0 0-.832-.445h-4.93l-1.248-1.873L9.414 14H11v2h2v-2.734l3.868-6.77l-1.736-.992L14.277 7h-2.742L10.45 5.371A11.861 11.861 0 0 1 20 4.7V8a1 1 0 0 0 1 1h1.465a1 1 0 0 0 .832-.445l.877-1.316A12.033 12.033 0 0 1 26.894 11H22.82a1 1 0 0 0-.98.804l-.723 4.47a1 1 0 0 0 .54 1.055L25 19l.685 4.056A11.98 11.98 0 0 1 16 28Z"
                />
              </svg>
              {{ player.location }}
            </div>
          </div>
          <div class="bg-stone-900 p-4 w-full md:w-3/4 lg:w-2/3 xl:w-1/2 m-auto shadow-xl">
            <p class="whitespace-pre">
              {{ player.bio }}
            </p>
          </div>
          <div class="flex flex-col gap-4">
            <div class="flex gap-3 justify-end px-4">
              <button
                class="rounded w-[100px] py-1 justify-center font-dumbledor text-lg flex gap-2 bg-stone-600 hover:bg-stone-700 transition duration-150"
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
                class="rounded w-[100px] py-1 justify-center font-dumbledor text-lg flex gap-2 bg-stone-600 hover:bg-stone-700 transition duration-150"
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
            <div class="flex-grow">
              <GameOverviewGrid
                v-if="gameView === 'grid'"
                :games="games"
                :username="player.username"
                :readonly="readonly"
                @delete="emit('deleteGame', $event)"
              />
              <GameOverviewTable
                v-if="gameView === 'table'"
                :games="games"
                :username="player.username"
                :readonly="readonly"
                @delete="emit('deleteGame', $event)"
              />
            </div>
          </div>
        </div>
      </section>
    </template>
    <template v-else>
      <p class="text-center text-2xl my-4 font-dumbledor">No games yet!</p>
      <nuxt-link
        to="/add-game"
        class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded text-center text-xl m-auto block w-[300px] my-8"
      >
        Add Your First Game
      </nuxt-link>
    </template>
  </template>
</template>

<script setup lang="ts">
import type { Game, Character, UserSettings } from "@prisma/client";
const gameView = ref<"grid" | "table">("grid");

defineProps<{
  player: {
    user_id: string;
    username: string;
    display_name: string;
    avatar: string | null;
    pronouns: string;
    location: string;
    bio: string;
  } | null;
  games: (Game & { player_characters: Character[] })[];
  readonly?: boolean;
}>();

const emit = defineEmits(["deleteGame"]);
</script>

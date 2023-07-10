<template>
  <template v-if="player">
    <template v-if="games.length">
      <section class="flex flex-col md:flex-row gap-8 pb-12 md:pb-0">
        <div
          class="flex flex-col w-full md:w-1/4 p-2"
          :class="{
            'hidden md:block': openTab !== 'charts',
            block: openTab === 'charts',
          }"
        >
          <Avatar
            :value="player.avatar || ''"
            class="border-2 shadow-xl m-auto"
          />
          <h3 class="font-piratesbay text-2xl lg:text-4xl text-center">
            {{ player.display_name }}
          </h3>
          <TopCharacters class="w-full sm:w-1/2 md:w-full p-2" :games="games" />
          <WinRate class="w-full sm:w-1/2 md:w-full p-2" :games="games" />
          <RoleType class="w-full sm:w-1/2 md:w-full p-2" :games="games" />
        </div>
        <div class="w-full md:w-3/4 flex flex-col gap-8">
          <div
            class="flex-col items-center p-2"
            :class="{
              hidden: openTab !== 'all',
              'flex md:hidden': openTab === 'all',
            }"
          >
            <Avatar :value="player.avatar || ''" class="border-2 shadow-xl" />
            <h3 class="font-piratesbay text-2xl xl:text-4xl">
              {{ player.display_name }}
            </h3>
          </div>
          <GamesOverTime
            class="w-full max-h-[200px] flex justify-center flex-col items-center p-2"
            :class="{
              'hidden md:block': openTab !== 'charts',
              block: openTab === 'charts',
            }"
            :games="games"
          />
          <div
            class="flex flex-col gap-4"
            :class="{
              'hidden md:block': openTab === 'charts',
              flex: openTab !== 'charts',
            }"
          >
            <div class="flex gap-3 justify-end px-4">
              <button
                class="rounded w-[100px] py-1 justify-center font-piratesbay text-lg flex gap-2 bg-stone-600 hover:bg-stone-700 transition duration-150"
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
                class="rounded w-[100px] py-1 justify-center font-piratesbay text-lg flex gap-2 bg-stone-600 hover:bg-stone-700 transition duration-150"
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
      <section class="fixed md:hidden bottom-0 w-screen bg-stone-950">
        <div class="flex justify-around">
          <button class="flex-1 py-5" @click="openTab = 'all'">
            All Games
          </button>
          <button class="flex-1 py-5" @click="openTab = 'charts'">
            Charts
          </button>
        </div>
      </section>
    </template>
    <template v-else>
      <p class="text-center text-2xl my-4 font-piratesbay">No games yet!</p>
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
const openTab = ref<"all" | "charts">("all");
const gameView = ref<"grid" | "table">("grid");

const props = defineProps<{
  player: {
    user_id: string;
    username: string;
    display_name: string;
    avatar: string | null;
  } | null;
  games: (Game & { player_characters: Character[] })[];
  readonly?: boolean;
}>();

const emit = defineEmits(["deleteGame"]);
</script>

<template>
  <template v-if="games.length">
    <section class="flex flex-col md:flex-row gap-8 pb-12 md:pb-0">
      <div
        class="flex flex-wrap w-full md:w-1/4"
        :class="{
          'hidden md:block': openTab !== 'charts',
          block: openTab === 'charts',
        }"
      >
        <div class="flex gap-4 items-center p-2">
          <Avatar
            :value="player.data.value?.avatar || ''"
            class="border-2 shadow-xl"
          />
          <h3 class="font-piratesbay text-4xl">
            {{ player.data.value?.username }}
          </h3>
        </div>
        <TopCharacters class="w-full sm:w-1/2 md:w-full p-2" :games="games" />
        <WinRate class="w-full sm:w-1/2 md:w-full p-2" :games="games" />
        <RoleType class="w-full sm:w-1/2 md:w-full p-2" :games="games" />
      </div>
      <div class="w-full md:w-3/4 flex flex-col gap-8">
        <div
          class="gap-4 items-center p-2"
          :class="{
            hidden: openTab !== 'all',
            'flex md:hidden': openTab === 'all',
          }"
        >
          <Avatar
            :value="player.data.value?.avatar || ''"
            class="border-2 shadow-xl"
          />
          <h3 class="font-piratesbay text-4xl">
            {{ player.data.value?.username }}
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
          class="flex flex-col-reverse md:flex-row gap-4"
          :class="{
            'hidden md:block': openTab === 'charts',
            flex: openTab !== 'charts',
          }"
        >
          <div class="flex-grow">
            <GameOverviewGrid
              :games="games"
              :username="username"
              :readonly="readonly"
              @delete="emit('deleteGame', $event)"
            />
          </div>
        </div>
      </div>
    </section>
    <section class="fixed md:hidden bottom-0 w-screen bg-stone-950">
      <div class="flex justify-around">
        <button class="flex-1 py-5" @click="openTab = 'all'">All Games</button>
        <button class="flex-1 py-5" @click="openTab = 'charts'">Charts</button>
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

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
const openTab = ref<"all" | "charts">("all");

const props = defineProps<{
  username: string;
  games: (Game & { player_characters: Character[] })[];
  readonly?: boolean;
}>();

const emit = defineEmits(["deleteGame"]);

const player = await useFetch(`/api/user/${props.username}`);
</script>

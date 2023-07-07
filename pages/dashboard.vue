<template>
  <DashboardTemplate>
    <template v-if="games.data.value?.length">
      <section class="flex flex-col md:flex-row gap-8">
        <div class="w-full md:w-3/4 flex flex-col gap-8">
          <div class="flex flex-col md:flex-row gap-4">
            <GameOverviewTable
              class="flex-grow"
              :games="games.data.value"
              @delete="deleteGame"
            />
            <TopCharacters
              class="w-full sm:w-1/3 md:w-1/6 p-2"
              :games="games.data.value"
            />
          </div>
          <GamesOverTime
            class="w-full max-h-[450px] flex justify-center flex-col items-center p-2"
            :games="games.data.value"
          />
        </div>
        <div class="flex flex-wrap w-full md:w-1/4">
          <WinRate
            class="w-full sm:w-1/2 md:w-full p-2"
            :games="games.data.value"
          />
          <!-- <Alignment class="w-full sm:w-1/2 md:w-full p-2" :games="games.data.value" /> -->
          <RoleType
            class="w-full sm:w-1/2 md:w-full p-2"
            :games="games.data.value"
          />
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
  </DashboardTemplate>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Dashboard",
});

const games = await useFetch<(Game & { player_characters: Character[] })[]>(
  `/api/games`
);

async function deleteGame(id: string) {
  if (confirm("Are you sure you want to delete this game?")) {
    const result = await fetch(`/api/games/${id}`, {
      method: "delete",
    }).then((res) => res.json());

    games.data.value = games.data.value!.filter((game) => game.id !== id);
  }
}
</script>

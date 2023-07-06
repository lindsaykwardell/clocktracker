<template>
  <DashboardTemplate>
    <template v-if="games.data.value?.length">
      <GameOverviewTable :games="games.data.value" />
      <PlayerCharts :games="games.data.value" />
    </template>
    <template v-else>
      <p class="text-center text-2xl">No games yet!</p>
      <nuxt-link
        to="/add-game"
        class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded text-center text-2xl m-auto block w-[300px] my-8"
      >
        Add Your First Game
      </nuxt-link>
    </template>
  </DashboardTemplate>
</template>

<script setup lang="ts">
import type { game } from "@prisma/client";
definePageMeta({
  middleware: "auth",
});

const games = await useFetch<game[]>(`/api/games`);
</script>

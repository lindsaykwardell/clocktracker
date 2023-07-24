<template>
  <div
    class="flex flex-col items-center justify-center sm:flex-row flex-wrap gap-y-12"
  >
    <template v-if="games.status === Status.LOADING"> Loading... </template>
    <template v-else-if="games.status === Status.ERROR">
      Error loading games
    </template>
    <template v-else-if="games.status === Status.SUCCESS">
      <GamesOverTime :games="games.data" class="h-[250px] w-screen md:w-3/5" />
      <TopCharacters :games="games.data" class="sm:w-1/2 md:w-2/5 pl-4" />
      <WinRateByRole :games="games.data" class="h-[250px] w-screen md:w-1/3" />
      <RoleType :games="games.data" class="h-[250px] w-screen md:w-1/3" />
    </template>
  </div>
  <!-- Hack, I'm sorry future me -->
  <div class="h-[30px]">&nbsp;</div>
</template>

<script setup lang="ts">
import { FetchStatus } from "composables/useFetchStatus";
import { GameRecord } from "composables/useGames";

defineProps<{
  games: FetchStatus<GameRecord[]>;
}>();
</script>

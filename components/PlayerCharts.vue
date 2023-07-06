<template>
  <div
    class="flex flex-col sm:flex-row flex-wrap items-center space-around md:gap-4 justify-center"
  >
    <GamesOverTime class="w-full max-h-[450px] flex justify-center flex-col items-center p-2" :games="games" />
    <WinRate class="w-full sm:w-1/2 md:w-1/4 p-2" :games="games" />
    <Alignment class="w-full sm:w-1/2 md:w-1/4 p-2" :games="games" />
    <RoleType class="w-full sm:w-1/2 md:w-1/4 p-2" :games="games" />
    <!-- <WinRateByRole class="w-full sm:w-1/2 md:w-1/4 p-2" :games="games" /> -->
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import RoleType from "./RoleType.vue";
import GamesOverTime from "./GamesOverTime.vue";

defineProps<{
  games: (Game & { player_characters: Character[] })[];
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center sm:flex-row flex-wrap gap-y-12">
    <GamesOverTime :games="games" class="h-[150px] w-screen md:w-3/4" />
    <TopCharacters :games="games" class="sm:w-1/2 md:w-1/5" />
    <WinRateByRole :games="games" class="h-[250px] sm:w-1/3 md:w-1/4" />
    <RoleType :games="games" class="h-[250px] sm:w-1/3 w-1/4" />
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";

defineProps<{
  games: (Game & { player_characters: Character[] })[];
}>();
</script>

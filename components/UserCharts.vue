<template>
  <div
    class="flex flex-col items-center justify-center sm:flex-row flex-wrap gap-y-12"
  >
    <GamesOverTime :games="games" class="h-[250px] w-screen md:w-3/5" />
    <TopCharacters :games="games" class="sm:w-1/2 md:w-2/5 pl-4" />
    <WinRateByRole :games="games" class="h-[250px] w-screen md:w-1/3" />
    <RoleType :games="games" class="h-[250px] w-screen md:w-1/3" />
  </div>
  <!-- Hack, I'm sorry future me -->
  <div class="h-[30px]">&nbsp;</div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";

defineProps<{
  games: (Game & {
    player_characters: (Character & { role?: { token_url: string } })[];
  })[];
}>();
</script>

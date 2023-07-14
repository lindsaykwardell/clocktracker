<template>
  <div class="flex flex-col md:flex-row">
    <WinRate :games="games" class="w-1/5" />
    <RoleType :games="games" class="w-1/5" />
    <TopCharacters :games="games" class="w-1/5" />
    <GamesOverTime :games="games" class="h-[150px] w-full md:w-2/5" />
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";

defineProps<{
  games: (Game & { player_characters: Character[] })[];
}>();
</script>

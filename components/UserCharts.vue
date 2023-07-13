<template>
  <div class="flex flex-col md:flex-row">
    <WinRate :games="games" class="w-1/5" />
    <RoleType :games="games" class="w-1/5" />
    <TopCharacters :games="games" class="w-1/5" />
    <GamesOverTime :games="games" class="h-[150px] w-full md:w-2/5"/>
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";

const props = defineProps<{
  player: {
    username: string;
    user_id: string;
    display_name: string;
    avatar: string | null;
    pronouns: string | null;
    bio: string;
    location: string | null;
  } | null;
  games: (Game & { player_characters: Character[] })[];
}>();
</script>

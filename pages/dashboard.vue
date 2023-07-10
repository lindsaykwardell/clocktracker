<template>
  <DashboardTemplate>
    <Dashboard
      :username="user?.user_metadata.full_name"
      :games="games.data.value || []"
      @deleteGame="deleteGame"
    />
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

const user = useSupabaseUser();

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

<template>
  <DashboardTemplate>
    <Dashboard
      :username="username"
      :games="games.data.value || []"
      :readonly="readonly"
      @deleteGame="deleteGame"
    />
  </DashboardTemplate>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
const route = useRoute();
const username = useRoute().params.username as string;

const user = useSupabaseUser();
const player = await useFetch(`/api/user/${username}`);

const readonly = computed(() => player.data.value?.user_id !== user.value?.id);

useHead({
  title: username,
  meta: [
    {
      hid: "description",
      name: "description",
      content: `View ${username}'s profile on ClockTracker`,
    },
    {
      property: "og:title",
      content: `${username} | ClockTracker`,
    },
    {
      property: "og:description",
      content: `View ${username}'s profile on ClockTracker`,
    },
    {
      property: "og:image",
      content: player.data.value?.avatar || "",
    },
    {
      property: "og:url",
      content: route.fullPath,
    },
    {
      property: "twitter:card",
      content: "summary_large_image",
    },
    {
      property: "twitter:url",
      content: route.fullPath,
    },
    {
      property: "twitter:title",
      content: `${username} | ClockTracker`,
    },
    {
      property: "twitter:description",
      content: `View ${username}'s profile on ClockTracker`,
    },
    {
      property: "twitter:image",
      content: player.data.value?.avatar || "",
    },
  ],
});

const games = await useFetch<(Game & { player_characters: Character[] })[]>(
  `/api/user/${username}/games`
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

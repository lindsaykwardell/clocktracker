<template>
  <AuthenticatedTemplate>
    <div class="w-full flex flex-col gap-8">
      <UserHeader :player="player.data.value" />
      <template v-if="route.query.view === 'charts'">
        <div>Charts! Woo!</div>
      </template>
      <Dashboard
        v-else
        :player="player.data.value"
        :games="games.data.value || []"
      />
    </div>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
const route = useRoute();
const username = useRoute().params.username as string;

const user = useSupabaseUser();
const player = await useFetch(`/api/user/${username}`);
const games = await useFetch<(Game & { player_characters: Character[] })[]>(
  `/api/user/${username}/games`
);

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
</script>

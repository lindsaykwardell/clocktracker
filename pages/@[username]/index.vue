<template>
  <AuthenticatedTemplate>
    <div class="w-full flex flex-col gap-8">
      <UserHeader :player="player.data.value!">
        <div class="flex gap-3 justify-start w-full">
          <nuxt-link
            :to="`/@${username}`"
            class="font-bold text-lg border-b-4 py-1 px-3 hover:bg-stone-700"
            :class="currentTabClass('dashboard')"
          >
            Dashboard
          </nuxt-link>
          <nuxt-link
            :to="`/@${username}?view=charts`"
            class="font-bold text-lg border-b-4 py-1 px-3 hover:bg-stone-700"
            :class="currentTabClass('charts')"
          >
            Charts
          </nuxt-link>
        </div>
      </UserHeader>
      <UserCharts
        v-if="currentTab === 'charts'"
        :games="games.data.value || []"
      />
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

const player = await useFetch(`/api/user/${username}`);
const games = await useFetch<(Game & { player_characters: Character[] })[]>(
  `/api/user/${username}/games`
);

const currentTab = computed(() => {
  return route.query.view === "charts" ? "charts" : "dashboard";
});

function currentTabClass(tab: string) {
  return {
    "border-stone-500": currentTab.value === tab,
    "border-transparent": currentTab.value !== tab,
  };
}

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

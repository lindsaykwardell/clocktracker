<template>
  <DashboardTemplate>
    <template v-if="games.data.value?.length">
      <section class="flex flex-col md:flex-row gap-8 pb-12 md:pb-0">
        <div class="w-full md:w-3/4 flex flex-col gap-8">
          <div
            class="flex flex-col-reverse md:flex-row gap-4"
            :class="{
              'hidden md:block': openTab === 'charts',
              flex: openTab !== 'charts',
            }"
          >
            <div class="flex-grow">
              <h3 class="font-piratesbay text-2xl text-center">
                {{ username }}'s Games
              </h3>
              <GameOverviewGrid
                :games="games.data.value"
                readonly
                :username="username"
              />
            </div>
          </div>
          <GamesOverTime
            class="w-full max-h-[450px] flex justify-center flex-col items-center p-2"
            :class="{
              'hidden md:block': openTab !== 'charts',
              block: openTab === 'charts',
            }"
            :games="games.data.value"
          />
        </div>
        <div
          class="flex flex-wrap w-full md:w-1/4"
          :class="{
            'hidden md:block': openTab !== 'charts',
            block: openTab === 'charts',
          }"
        >
          <TopCharacters
            class="w-full sm:w-1/2 md:w-full p-2"
            :games="games.data.value"
          />
          <WinRate
            class="w-full sm:w-1/2 md:w-full p-2"
            :games="games.data.value"
          />
          <!-- <Alignment class="w-full sm:w-1/2 md:w-full p-2" :games="games.data.value" /> -->
          <RoleType
            class="w-full sm:w-1/2 md:w-full p-2"
            :games="games.data.value"
          />
        </div>
      </section>
      <section class="fixed md:hidden bottom-0 w-screen bg-stone-950">
        <div class="flex justify-around">
          <button class="flex-1 py-5" @click="openTab = 'all'">
            All Games
          </button>
          <button class="flex-1 py-5" @click="openTab = 'charts'">
            Charts
          </button>
        </div>
      </section>
    </template>
    <template v-else>
      <p class="text-center text-2xl my-4 font-piratesbay">
        {{ username }} has no games yet!
      </p>
    </template>
  </DashboardTemplate>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
const route = useRoute();
const username = useRoute().params.username as string;

const player = await useFetch(`/api/user/${username}`);

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

const openTab = ref<"all" | "charts">("all");
</script>

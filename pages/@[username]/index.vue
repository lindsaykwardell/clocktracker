<template>
  <AuthenticatedTemplate>
    <div class="w-full flex flex-col gap-8">
      <UserHeader :player="player.data.value!">
        <div class="flex justify-start w-full">
          <nuxt-link
            :to="`/@${username}`"
            class="font-bold text-lg border-b-4 py-1 px-2 md:px-3 hover:bg-stone-700"
            :class="currentTabClass('dashboard')"
          >
            Dashboard
          </nuxt-link>
          <nuxt-link
            :to="`/@${username}?view=charts`"
            class="font-bold text-lg border-b-4 py-1 px-2 md:px-3 hover:bg-stone-700"
            :class="currentTabClass('charts')"
          >
            Charts
          </nuxt-link>
          <nuxt-link
            :to="`/@${username}?view=followers`"
            class="font-bold text-lg border-b-4 py-1 px-2 md:px-3 hover:bg-stone-700"
            :class="currentTabClass('followers')"
          >
            {{ player.data.value?.followers.length }}
            {{
              player.data.value?.followers.length === 1
                ? "Follower"
                : "Followers"
            }}
          </nuxt-link>
          <nuxt-link
            :to="`/@${username}?view=following`"
            class="font-bold text-lg border-b-4 py-1 px-2 md:px-3 hover:bg-stone-700"
            :class="currentTabClass('following')"
          >
            {{ player.data.value?.following.length }} Following
          </nuxt-link>
        </div>
      </UserHeader>
      <UserCharts
        v-if="currentTab === 'charts'"
        :games="games.data.value || []"
      />
      <div
        v-if="currentTab === 'followers'"
        class="flex flex-col gap-4 w-11/12 md:3/4 lg:w-2/3 xl:w-[1000px] m-auto"
      >
        <UserCard
          v-for="follower in player.data.value?.followers"
          :player="follower.user"
        />
      </div>
      <div
        v-if="currentTab === 'following'"
        class="flex flex-col gap-4 w-11/12 md:3/4 lg:w-2/3 xl:w-[1000px] m-auto"
      >
        <UserCard
          v-for="following in player.data.value?.following"
          :player="following.following"
        />
      </div>
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
const games = await useFetch<
  (Game & {
    player_characters: (Character & {
      role?: { token_url: string; type: string };
      related_role?: { token_url: string };
    })[];
  })[]
>(`/api/user/${username}/games`);

const currentTab = computed(() => {
  switch (route.query.view) {
    case "charts":
      return "charts";
    case "followers":
      return "followers";
    case "following":
      return "following";
    default:
      return "dashboard";
  }
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

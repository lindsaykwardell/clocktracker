<template>
  <AuthenticatedTemplate>
    <div class="w-full flex flex-col gap-8">
      <template v-if="playerFetchStatus === Status.SUCCESS && player">
        <UserHeader :player="player">
          <div class="flex justify-start overflow-scroll w-screen md:w-full gap-1 h-12">
            <nuxt-link
              :to="`/@${username}`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('dashboard')"
            >
              Games
            </nuxt-link>
            <nuxt-link
              :to="`/@${username}?view=charts`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('charts')"
            >
              Charts
            </nuxt-link>
            <nuxt-link
              :to="`/@${username}?view=followers`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('followers')"
            >
              {{ player.followers.length }}
              {{ player.followers.length === 1 ? "Follower" : "Followers" }}
            </nuxt-link>
            <nuxt-link
              :to="`/@${username}?view=following`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('following')"
            >
              {{ player.following.length }} Following
            </nuxt-link>
          </div>
        </UserHeader>
        <UserCharts v-if="currentTab === 'charts'" :games="games" />
        <div
          v-if="currentTab === 'followers'"
          class="flex flex-col gap-4 w-11/12 md:3/4 lg:w-2/3 xl:w-[1000px] m-auto"
        >
          <UserCard
            v-for="follower in player.followers"
            :player="follower.user"
          />
        </div>
        <div
          v-if="currentTab === 'following'"
          class="flex flex-col gap-4 w-11/12 md:3/4 lg:w-2/3 xl:w-[1000px] m-auto"
        >
          <UserCard
            v-for="following in player.following"
            :player="following.following"
          />
        </div>
        <Dashboard
          v-if="currentTab === 'dashboard'"
          :player="player"
          :games="games"
        />
      </template>
      <template v-else>
        <Loading class="h-screen" />
      </template>
    </div>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
const route = useRoute();
const users = useUsers();
const gameStore = useGames();
const username = useRoute().params.username as string;

const playerStatus = computed(() => users.getUser(username));
const playerFetchStatus = computed(() => playerStatus.value.status);
const player = computed(() => {
  if (playerStatus.value.status === Status.SUCCESS) {
    return playerStatus.value.data;
  } else {
    return null;
  }
});

const games = computed(() => {
  return gameStore.getByPlayer(username);
});

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

onMounted(() => {
  users.fetchUser(username);
  gameStore.fetchPlayerGames(username);
});

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
      content: player.value?.avatar || "",
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
      content: player.value?.avatar || "",
    },
  ],
});
</script>
